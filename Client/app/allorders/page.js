"use client";
import { useEffect, useState, useRef } from "react";
import * as XLSX from 'xlsx';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("");
  
  // Search and filter states
  const [capacityFilter, setCapacityFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [referenceSearch, setReferenceSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [networkFilter, setNetworkFilter] = useState("");
  
  // Debounced search states
  const [debouncedPhone, setDebouncedPhone] = useState("");
  const [debouncedReference, setDebouncedReference] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(100);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Ref for debounce timers
  const phoneTimerRef = useRef(null);
  const referenceTimerRef = useRef(null);

  // Debounce phone search
  useEffect(() => {
    if (phoneTimerRef.current) {
      clearTimeout(phoneTimerRef.current);
    }
    
    phoneTimerRef.current = setTimeout(() => {
      setDebouncedPhone(phoneSearch);
      setCurrentPage(1); // Reset to first page on new search
    }, 500); // 500ms debounce
    
    return () => {
      if (phoneTimerRef.current) {
        clearTimeout(phoneTimerRef.current);
      }
    };
  }, [phoneSearch]);

  // Debounce reference search
  useEffect(() => {
    if (referenceTimerRef.current) {
      clearTimeout(referenceTimerRef.current);
    }
    
    referenceTimerRef.current = setTimeout(() => {
      setDebouncedReference(referenceSearch);
      setCurrentPage(1); // Reset to first page on new search
    }, 500); // 500ms debounce
    
    return () => {
      if (referenceTimerRef.current) {
        clearTimeout(referenceTimerRef.current);
      }
    };
  }, [referenceSearch]);

  // Fetch orders from backend with all filters
  useEffect(() => {
    const fetchOrders = async () => {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        alert("Unauthorized access!");
        return;
      }

      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams({
          page: currentPage,
          limit: ordersPerPage
        });
        
        // Add filters to params
        if (capacityFilter) params.append('capacity', capacityFilter);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (debouncedPhone) params.append('phoneNumber', debouncedPhone);
        if (debouncedReference) params.append('reference', debouncedReference);
        if (statusFilter) params.append('status', statusFilter);
        if (networkFilter) params.append('network', networkFilter);
        
        const res = await fetch(`https://datahustle.onrender.com/api/orders?${params.toString()}`, {
          headers: {
            'x-auth-token': authToken
          }
        });

        if (!res.ok) {
          throw new Error("Failed to fetch orders");
        }

        const data = await res.json();
        console.log("API Response:", data);

        if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders);
          setTotalOrders(data.totalOrders || 0);
          setTotalPages(data.totalPages || 1);
        } else {
          console.error("Unexpected response format:", data);
          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [
    currentPage, 
    ordersPerPage, 
    capacityFilter, 
    startDate, 
    endDate, 
    debouncedPhone, 
    debouncedReference, 
    statusFilter, 
    networkFilter
  ]);

  const updateOrderStatus = async (orderId, newStatus) => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      alert("Unauthorized access!");
      return;
    }

    try {
      const res = await fetch(`https://datahustle.onrender.com/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'x-auth-token': authToken
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            (order.id === orderId || order.geonetReference === orderId) 
              ? { ...order, status: newStatus } 
              : order
          )
        );
        alert(`Order ${orderId} updated successfully!`);
      } else {
        console.error("Failed to update order");
        alert("Failed to update order. Please try again.");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Error updating order. Please try again.");
    }
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedOrders.length === 0) {
      alert("Please select orders and a status to update");
      return;
    }

    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      alert("Unauthorized access!");
      return;
    }

    try {
      let successfulUpdates = 0;
      let failedUpdates = 0;
      
      for (const orderId of selectedOrders) {
        try {
          const res = await fetch(`https://datahustle.onrender.com/api/orders/${orderId}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              'x-auth-token': authToken
            },
            body: JSON.stringify({ status: bulkStatus }),
          });
          
          if (res.ok) {
            successfulUpdates++;
          } else {
            failedUpdates++;
            console.error(`Failed to update order ${orderId}`, await res.text());
          }
        } catch (error) {
          failedUpdates++;
          console.error(`Error updating order ${orderId}:`, error);
        }
      }
      
      if (successfulUpdates > 0) {
        setOrders(prevOrders => 
          prevOrders.map(order => {
            if (selectedOrders.includes(order.id) || 
                selectedOrders.includes(order.geonetReference)) {
              return { ...order, status: bulkStatus };
            }
            return order;
          })
        );
      }
      
      if (failedUpdates === 0) {
        alert(`Successfully updated all ${successfulUpdates} orders!`);
      } else {
        alert(`Updated ${successfulUpdates} orders. ${failedUpdates} orders failed to update.`);
      }
      
      setSelectedOrders([]);
      setBulkStatus("");
      
      if (failedUpdates > 0) {
        setLoading(true);
        // Refresh data
        setTimeout(() => setCurrentPage(1), 100);
      }
    } catch (error) {
      console.error("Error performing bulk update:", error);
      alert("Error updating orders. Please try again.");
    }
  };

  const exportToExcel = () => {
    const dataToExport = orders.map(order => ({
      'Reference': order.geonetReference || order.id,
      'Phone Number': order.phoneNumber,
      'Buyer Name': order.userId?.name || 'Unknown',
      'Buyer Phone': order.userId?.phoneNumber || 'N/A',
      'CapacityinGb': order.capacity,
      'Network': order.network,
      'Status': order.status,
      'Date': formatDate(order.createdAt)
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    
    const cols = [
      { wch: 15 },  // Reference
      { wch: 15 },  // Phone Number
      { wch: 20 },  // Buyer Name
      { wch: 15 },  // Buyer Phone
      { wch: 10 },  // Capacity
      { wch: 10 },  // Network
      { wch: 12 },  // Status
      { wch: 20 }   // Date
    ];
    
    worksheet['!cols'] = cols;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    
    const fileName = `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const setTodayFilter = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayString = today.toISOString().split('T')[0];
    setStartDate(todayString);
    setEndDate(todayString);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setPhoneSearch("");
    setReferenceSearch("");
    setCapacityFilter("");
    setStatusFilter("");
    setNetworkFilter("");
    setCurrentPage(1);
  };
  
  const clearPhoneSearch = () => {
    setPhoneSearch("");
  };
  
  const clearReferenceSearch = () => {
    setReferenceSearch("");
  };

  const handleOrdersPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    setOrdersPerPage(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'processing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'waiting':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Admin Orders</h1>
      
      {/* Filters and Bulk Actions */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col space-y-4">
          {/* Search Row */}
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 flex-wrap gap-2">
            {/* Phone Number Search */}
            <div className="flex items-center relative">
              <label htmlFor="phoneSearch" className="mr-2 text-gray-700 dark:text-gray-300 text-sm">Phone:</label>
              <input
                type="text"
                id="phoneSearch"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                placeholder="Search any phone..."
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {phoneSearch && (
                <button 
                  onClick={clearPhoneSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Clear phone search"
                >
                  ✕
                </button>
              )}
              {debouncedPhone !== phoneSearch && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Searching...</span>
              )}
            </div>
            
            {/* Reference Search */}
            <div className="flex items-center relative">
              <label htmlFor="referenceSearch" className="mr-2 text-gray-700 dark:text-gray-300 text-sm">Reference:</label>
              <input
                type="text"
                id="referenceSearch"
                value={referenceSearch}
                onChange={(e) => setReferenceSearch(e.target.value)}
                placeholder="Search reference..."
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {referenceSearch && (
                <button 
                  onClick={clearReferenceSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Clear reference search"
                >
                  ✕
                </button>
              )}
              {debouncedReference !== referenceSearch && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Searching...</span>
              )}
            </div>
            
            {/* Capacity Filter */}
            <div className="flex items-center">
              <label htmlFor="capacityFilter" className="mr-2 text-gray-700 dark:text-gray-300 text-sm">Capacity:</label>
              <select
                id="capacityFilter"
                value={capacityFilter}
                onChange={(e) => {
                  setCapacityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All</option>
                <option value="1">1 GB</option>
                <option value="2">2 GB</option>
                <option value="3">3 GB</option>
                <option value="4">4 GB</option>
                <option value="5">5 GB</option>
                <option value="10">10 GB</option>
              </select>
            </div>
            
            {/* Network Filter */}
            <div className="flex items-center">
              <label htmlFor="networkFilter" className="mr-2 text-gray-700 dark:text-gray-300 text-sm">Network:</label>
              <select
                id="networkFilter"
                value={networkFilter}
                onChange={(e) => {
                  setNetworkFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All</option>
                <option value="telecel">Telecel</option>
                <option value="YELLO">MTN</option>
                <option value="airteltigo">AirtelTigo</option>
              </select>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center">
              <label htmlFor="statusFilter" className="mr-2 text-gray-700 dark:text-gray-300 text-sm">Status:</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="waiting">Waiting</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            {/* Orders per page */}
            <div className="flex items-center ml-auto">
              <label htmlFor="ordersPerPage" className="mr-2 text-gray-700 dark:text-gray-300 text-sm">Per page:</label>
              <select
                id="ordersPerPage"
                value={ordersPerPage}
                onChange={handleOrdersPerPageChange}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="10">10</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="500">500</option>
              </select>
            </div>
          </div>
          
          {/* Date Filter Row */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <label htmlFor="startDate" className="mr-2 text-gray-700 dark:text-gray-300 text-sm">From:</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="flex items-center">
              <label htmlFor="endDate" className="mr-2 text-gray-700 dark:text-gray-300 text-sm">To:</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <button
              onClick={setTodayFilter}
              className="px-3 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium"
            >
              Today's Orders
            </button>
            
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium"
            >
              Clear Filters
            </button>
            
            <button
              onClick={exportToExcel}
              className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium ml-auto"
            >
              Export to Excel
            </button>
          </div>
          
          {/* Bulk Actions Row */}
          <div className="flex items-center space-x-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select Status</option>
              <option value="pending">Pending</option>
              <option value="waiting">Waiting</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
            </select>
            <button
              onClick={handleBulkUpdate}
              disabled={!bulkStatus || selectedOrders.length === 0}
              className={`px-4 py-2 rounded-lg font-medium ${
                !bulkStatus || selectedOrders.length === 0
                  ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500'
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }`}
            >
              Update Selected ({selectedOrders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Results summary */}
      <div className="mb-4 text-gray-600 dark:text-gray-400 text-sm">
        Showing {orders.length} orders | Total: {totalOrders} | Page {currentPage} of {totalPages}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-transparent border-t-yellow-500 rounded-full animate-spin absolute top-0"></div>
          </div>
          <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Loading...</span>
        </div>
      ) : (
        <>
          {orders.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg">No orders found</p>
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrders(orders.map(order => order.geonetReference || order.id));
                              } else {
                                setSelectedOrders([]);
                              }
                            }}
                            checked={selectedOrders.length === orders.length && orders.length > 0}
                            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Buyer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Order Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Buyer Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Capacity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Network
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {orders.map((order) => {
                        const orderId = order.geonetReference || order.id;
                        
                        return (
                          <tr key={orderId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedOrders.includes(orderId)}
                                onChange={() => toggleOrderSelection(orderId)}
                                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {orderId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {order.userId?.name || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {order.phoneNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {order.userId?.phoneNumber || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {order.capacity} GB
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {order.network}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <select
                                value={order.status || ""}
                                onChange={(e) => updateOrderStatus(orderId, e.target.value)}
                                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="pending">Pending</option>
                                <option value="waiting">Waiting</option>
                                <option value="processing">Processing</option>
                                <option value="failed">Failed</option>
                                <option value="delivered">Delivered</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Pagination Controls */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    currentPage === 1
                      ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  }`}
                >
                  Previous
                </button>
                
                <span className="text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    currentPage === totalPages
                      ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  }`}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AdminOrders;