// Run this in Supabase SQL editor:
// CREATE POLICY "Users can delete their own customers"
// ON customers FOR DELETE
// USING (auth.uid() = (SELECT user_id FROM businesses WHERE id = business_id));

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import supabase from "../supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CustomerManager() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [sendingStates, setSendingStates] = useState({});
  const [deletingStates, setDeletingStates] = useState({});
  const [filter, setFilter] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const { data: biz } = await supabase
          .from("businesses")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!biz) { setLoading(false); return; }
        setBusiness(biz);

        const { data: custs } = await supabase
          .from("customers")
          .select("*")
          .eq("business_id", biz.id)
          .order("created_at", { ascending: false });

        if (custs) setCustomers(custs);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user]);

  async function handleAddCustomer(e) {
    e.preventDefault();
    setAddError(null);
    if (!customerName.trim() || !customerPhone.trim()) {
      setAddError("Name and phone are required.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("customers")
      .insert({ business_id: business.id, customer_name: customerName.trim(), customer_phone: customerPhone.trim() })
      .select()
      .single();
    if (!error && data) {
      setCustomers((prev) => [data, ...prev]);
      setCustomerName("");
      setCustomerPhone("");
    }
    setSaving(false);
  }

  function handleCSVUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadSuccess(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());

      if (lines.length < 2) {
        setUploadError("CSV must have a header row and at least one data row.");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const nameIdx = headers.indexOf("name");
      const phoneIdx = headers.indexOf("phone");

      if (nameIdx === -1 || phoneIdx === -1) {
        setUploadError("CSV must have 'name' and 'phone' columns.");
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
        setUploadError("No valid rows found. Each row needs a name and phone.");
        return;
      }

      const { data, error } = await supabase.from("customers").insert(rows).select();
      if (error) {
        setUploadError("Failed to import customers. Please try again.");
        return;
      }
      if (data) setCustomers((prev) => [...data.reverse(), ...prev]);
      setUploadSuccess(`Successfully imported ${rows.length} customer${rows.length === 1 ? "" : "s"}`);
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  async function handleSendReviewRequest(customer) {
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

  async function handleDeleteCustomer(customer) {
    setDeletingStates((prev) => ({ ...prev, [customer.id]: true }));
    const { error } = await supabase.from("customers").delete().eq("id", customer.id);
    if (!error) {
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    }
    setDeletingStates((prev) => ({ ...prev, [customer.id]: false }));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.customer_name.toLowerCase().includes(filter.toLowerCase()) ||
      c.customer_phone.includes(filter)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-300 text-sm">You need to claim a business before managing customers.</p>
        <button
          onClick={() => navigate("/search")}
          className="text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
        >
          Search for your business
        </button>
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 flex flex-col gap-6">

        <div className="mb-2">
          <h1 className="text-2xl font-bold text-slate-100 mb-1">Review Requests</h1>
          <p className="text-sm text-slate-400">Add customers and send them a link to leave a Google review</p>
        </div>

        {/* Add customer */}
        <Card className="bg-slate-900 border border-slate-800 rounded-md">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-slate-200 text-base font-semibold">Add a customer</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <form onSubmit={handleAddCustomer} className="flex flex-col gap-3">
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
              </div>
              {addError && <p className="text-red-400 text-xs">{addError}</p>}
              <Button
                type="submit"
                disabled={saving}
                className="self-start bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-40 border-0"
              >
                {saving ? "Saving..." : "Add Customer"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* CSV import */}
        <Card className="bg-slate-900 border border-slate-800 rounded-md">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-slate-200 text-base font-semibold">Import from spreadsheet</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 flex flex-col gap-3">
            <p className="text-slate-400 text-sm">
              Upload a CSV file with columns:{" "}
              <span className="text-slate-300 font-mono">name</span>,{" "}
              <span className="text-slate-300 font-mono">phone</span>
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-700 file:text-slate-300 file:bg-slate-800 file:text-sm file:cursor-pointer hover:file:border-slate-500 hover:file:text-white cursor-pointer"
            />
            {uploadSuccess && <p className="text-green-400 text-sm">{uploadSuccess}</p>}
            {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}
          </CardContent>
        </Card>

        {/* Customer list */}
        <Card className="bg-slate-900 border border-slate-800 rounded-md">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-slate-200 text-base font-semibold">
              Customers ({customers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 flex flex-col gap-4">

            {customers.length > 0 && (
              <Input
                type="text"
                placeholder="Filter by name or phone..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-md max-w-sm"
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
                    {filteredCustomers.map((c, i) => (
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
                              onClick={() => handleSendReviewRequest(c)}
                              disabled={sendingStates[c.id] === "sending"}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-md disabled:opacity-40 border-0 h-auto"
                            >
                              {sendingStates[c.id] === "sending" ? "Sending..." : "Send Review Request"}
                            </Button>
                            <button
                              onClick={() => handleDeleteCustomer(c)}
                              disabled={deletingStates[c.id]}
                              className="text-red-400 hover:text-red-300 text-sm px-2 disabled:opacity-40 transition-colors"
                            >
                              {deletingStates[c.id] ? "..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCustomers.length === 0 && filter && (
                  <p className="text-slate-500 text-sm pt-3">No customers match your filter.</p>
                )}
              </div>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
