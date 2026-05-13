import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import supabase from "../supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export default function MyBusinesses() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState([]);
  const [customersByBusiness, setCustomersByBusiness] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedBusiness, setExpandedBusiness] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [addError, setAddError] = useState(null);

  const [sendingStates, setSendingStates] = useState({});
  const [deletingCustomer, setDeletingCustomer] = useState({});
  const [unclaimingBusiness, setUnclaimingBusiness] = useState({});
  const [confirmUnclaim, setConfirmUnclaim] = useState(null);

  const [csvError, setCsvError] = useState(null);
  const [csvSuccess, setCsvSuccess] = useState(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const { data: bizData } = await supabase
          .from("businesses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!bizData || bizData.length === 0) {
          setLoading(false);
          return;
        }

        setBusinesses(bizData);

        const custMap = {};
        await Promise.all(
          bizData.map(async (biz) => {
            const { data: custs } = await supabase
              .from("customers")
              .select("*")
              .eq("business_id", biz.id)
              .order("created_at", { ascending: false });
            custMap[biz.id] = custs || [];
          })
        );
        setCustomersByBusiness(custMap);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user]);

  function toggleBusiness(id) {
    setExpandedBusiness((prev) => (prev === id ? null : id));
    setCustomerName("");
    setCustomerPhone("");
    setAddError(null);
    setCsvError(null);
    setCsvSuccess(null);
    setFilter("");
    setConfirmUnclaim(null);
  }

  async function handleAddCustomer(e, business) {
    e.preventDefault();
    setAddError(null);
    if (!customerName.trim() || !customerPhone.trim()) {
      setAddError("Name and phone are required.");
      return;
    }
    setSavingCustomer(true);
    const { data, error } = await supabase
      .from("customers")
      .insert({
        business_id: business.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
      })
      .select()
      .single();
    if (!error && data) {
      setCustomersByBusiness((prev) => ({
        ...prev,
        [business.id]: [data, ...(prev[business.id] || [])],
      }));
      setCustomerName("");
      setCustomerPhone("");
    }
    setSavingCustomer(false);
  }

  function handleCSVUpload(e, business) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError(null);
    setCsvSuccess(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());

      if (lines.length < 2) {
        setCsvError("CSV must have a header row and at least one data row.");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const nameIdx = headers.indexOf("name");
      const phoneIdx = headers.indexOf("phone");

      if (nameIdx === -1 || phoneIdx === -1) {
        setCsvError("CSV must have 'name' and 'phone' columns.");
        return;
      }

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        const name = cols[nameIdx];
        const phone = cols[phoneIdx];
        if (name && phone) {
          rows.push({ business_id: business.id, customer_name: name, customer_phone: phone });
        }
      }

      if (rows.length === 0) {
        setCsvError("No valid rows found. Each row needs a name and phone.");
        return;
      }

      const { data, error } = await supabase.from("customers").insert(rows).select();
      if (error) {
        setCsvError("Failed to import customers. Please try again.");
        return;
      }
      if (data) {
        setCustomersByBusiness((prev) => ({
          ...prev,
          [business.id]: [...data.reverse(), ...(prev[business.id] || [])],
        }));
      }
      setCsvSuccess(`Imported ${rows.length} customer${rows.length === 1 ? "" : "s"}`);
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  async function handleSendReviewRequest(customer, business) {
    setSendingStates((prev) => ({ ...prev, [customer.id]: "sending" }));
    try {
      const response = await fetch("http://localhost:8080/api/sms/send-review-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: customer.customer_phone,
          customerName: customer.customer_name,
          businessName: business.business_name,
          placeId: business.place_id,
          business_id: business.id,
          customer_id: customer.id,
        }),
      });
      if (!response.ok) throw new Error();
      setSendingStates((prev) => ({ ...prev, [customer.id]: "sent" }));
      setTimeout(() => setSendingStates((prev) => ({ ...prev, [customer.id]: null })), 3000);
    } catch {
      setSendingStates((prev) => ({ ...prev, [customer.id]: "error" }));
    }
  }

  async function handleDeleteCustomer(customer, businessId) {
    setDeletingCustomer((prev) => ({ ...prev, [customer.id]: true }));
    const { error } = await supabase.from("customers").delete().eq("id", customer.id);
    if (!error) {
      setCustomersByBusiness((prev) => ({
        ...prev,
        [businessId]: prev[businessId].filter((c) => c.id !== customer.id),
      }));
    }
    setDeletingCustomer((prev) => ({ ...prev, [customer.id]: false }));
  }

  async function handleUnclaimBusiness(business) {
    setUnclaimingBusiness((prev) => ({ ...prev, [business.id]: true }));
    const { error } = await supabase.from("businesses").delete().eq("id", business.id);
    if (!error) {
      setBusinesses((prev) => prev.filter((b) => b.id !== business.id));
      setCustomersByBusiness((prev) => {
        const next = { ...prev };
        delete next[business.id];
        return next;
      });
      setConfirmUnclaim(null);
      if (expandedBusiness === business.id) setExpandedBusiness(null);
    }
    setUnclaimingBusiness((prev) => ({ ...prev, [business.id]: false }));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14]">

      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0f172a] border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-lg font-bold text-white focus:outline-none">
            REPUFLOW
          </button>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate("/search")} className="text-slate-400 hover:text-slate-200 text-sm transition-colors px-3 py-2">
              Search Businesses
            </button>
            <button onClick={() => navigate("/businesses")} className="text-white text-sm px-3 py-2">
              My Businesses
            </button>
            <button onClick={handleLogout} className="text-slate-400 hover:text-slate-200 text-sm transition-colors px-3 py-2">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16">

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 mb-1">My Businesses</h1>
            <p className="text-sm text-slate-400">Manage your claimed businesses and send review requests</p>
          </div>
          <button
            onClick={() => navigate("/search")}
            className="border border-slate-600 text-slate-300 hover:border-blue-500 hover:text-white rounded-md px-4 py-2 text-sm transition-colors"
          >
            Claim another business
          </button>
        </div>

        {businesses.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20">
            <p className="text-slate-400 text-sm">You haven't claimed any businesses yet.</p>
            <button
              onClick={() => navigate("/search")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors"
            >
              Search for your business
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {businesses.map((business) => {
            const isExpanded = expandedBusiness === business.id;
            const customers = customersByBusiness[business.id] || [];
            const filtered = customers.filter(
              (c) =>
                c.customer_name.toLowerCase().includes(filter.toLowerCase()) ||
                c.customer_phone.includes(filter)
            );

            return (
              <div key={business.id} className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">

                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  onClick={() => toggleBusiness(business.id)}
                >
                  <div>
                    <p className="text-white font-semibold text-base">{business.business_name}</p>
                    {business.address && (
                      <p className="text-slate-400 text-sm mt-0.5">{business.address}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        localStorage.setItem("activeBusinessId", business.id);
                        navigate("/dashboard");
                      }}
                      className="border border-slate-600 text-slate-300 hover:border-blue-500 hover:text-white rounded-md px-3 py-1.5 text-sm transition-colors"
                    >
                      View Dashboard
                    </button>
                    <span
                      className="text-slate-400"
                      onClick={() => toggleBusiness(business.id)}
                    >
                      {isExpanded ? <ChevronUp /> : <ChevronDown />}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-700 px-5 py-5 flex flex-col gap-6">

                    <div>
                      <p className="text-slate-200 text-sm font-semibold mb-3">Add a customer</p>
                      <form onSubmit={(e) => handleAddCustomer(e, business)} className="flex flex-col gap-3">
                        <div className="flex gap-3">
                          <Input
                            type="text"
                            placeholder="Customer name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-md"
                          />
                          <Input
                            type="text"
                            placeholder="Phone number"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-md"
                          />
                          <Button
                            type="submit"
                            disabled={savingCustomer}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-40 border-0 shrink-0"
                          >
                            {savingCustomer ? "Saving..." : "Add"}
                          </Button>
                        </div>
                        {addError && <p className="text-red-400 text-xs">{addError}</p>}
                      </form>
                    </div>

                    <div>
                      <p className="text-slate-200 text-sm font-semibold mb-1">Import from CSV</p>
                      <p className="text-slate-400 text-xs mb-3">
                        Upload a CSV with columns:{" "}
                        <span className="font-mono text-slate-300">name</span>,{" "}
                        <span className="font-mono text-slate-300">phone</span>
                      </p>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleCSVUpload(e, business)}
                        className="text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-700 file:text-slate-300 file:bg-slate-800 file:text-sm file:cursor-pointer hover:file:border-slate-500 hover:file:text-white cursor-pointer"
                      />
                      {csvSuccess && <p className="text-green-400 text-xs mt-2">{csvSuccess}</p>}
                      {csvError && <p className="text-red-400 text-xs mt-2">{csvError}</p>}
                    </div>

                    <div>
                      <p className="text-slate-200 text-sm font-semibold mb-3">
                        Customers ({customers.length})
                      </p>
                      {customers.length > 0 && (
                        <Input
                          type="text"
                          placeholder="Filter by name or phone..."
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-md max-w-sm mb-3"
                        />
                      )}
                      {customers.length === 0 ? (
                        <p className="text-slate-500 text-sm">No customers yet. Add your first customer above.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-800">
                                <th className="text-left text-slate-500 font-medium py-2 pr-4">Name</th>
                                <th className="text-left text-slate-500 font-medium py-2 pr-4">Phone</th>
                                <th className="text-right text-slate-500 font-medium py-2">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.map((c, i) => (
                                <tr
                                  key={c.id}
                                  className={`border-b border-slate-800/50 ${i % 2 !== 0 ? "bg-slate-800/20" : ""}`}
                                >
                                  <td className="py-3 pr-4 text-slate-200 font-medium">{c.customer_name}</td>
                                  <td className="py-3 pr-4 text-slate-400">{c.customer_phone}</td>
                                  <td className="py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {sendingStates[c.id] === "sent" && (
                                        <span className="text-green-400 text-xs">Sent ✓</span>
                                      )}
                                      {sendingStates[c.id] === "error" && (
                                        <span className="text-red-400 text-xs">Failed</span>
                                      )}
                                      <Button
                                        size="sm"
                                        onClick={() => handleSendReviewRequest(c, business)}
                                        disabled={sendingStates[c.id] === "sending"}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-md disabled:opacity-40 border-0 h-auto"
                                      >
                                        {sendingStates[c.id] === "sending" ? "Sending..." : "Send Review Request"}
                                      </Button>
                                      <button
                                        onClick={() => handleDeleteCustomer(c, business.id)}
                                        disabled={deletingCustomer[c.id]}
                                        className="text-red-400 hover:text-red-300 text-sm px-2 disabled:opacity-40 transition-colors"
                                      >
                                        {deletingCustomer[c.id] ? "..." : "Delete"}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {filtered.length === 0 && filter && (
                            <p className="text-slate-500 text-sm pt-3">No customers match your filter.</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      {confirmUnclaim === business.id ? (
                        <div className="flex items-center gap-3">
                          <p className="text-slate-400 text-sm">
                            Are you sure? This will remove your access to this business.
                          </p>
                          <button
                            onClick={() => handleUnclaimBusiness(business)}
                            disabled={unclaimingBusiness[business.id]}
                            className="text-red-400 hover:text-red-300 border border-red-900 rounded-md px-3 py-1.5 text-sm disabled:opacity-40 transition-colors"
                          >
                            {unclaimingBusiness[business.id] ? "Removing..." : "Confirm Unclaim"}
                          </button>
                          <button
                            onClick={() => setConfirmUnclaim(null)}
                            className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmUnclaim(business.id)}
                          className="text-red-400 hover:text-red-300 border border-red-900 rounded-md px-3 py-1.5 text-sm transition-colors"
                        >
                          Unclaim this business
                        </button>
                      )}
                    </div>

                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
