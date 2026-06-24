import React, { useState, useEffect } from 'react';

const ReceiptsTable = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReceiptsData = async () => {
      try {
        const response = await fetch('/api/recibos');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setReceipts(data.receipts || []);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceiptsData();
  }, []);

  if (loading) {
    return <div>Cargando recibos...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Recibos</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Tipo de pago</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map((receipt) => (
            <tr key={receipt.id}>
              <td>{receipt.id}</td>
              <td>{new Date(receipt.created_at).toLocaleString()}</td>
              <td>{receipt.total_money.amount / 100} {receipt.total_money.currency}</td>
              <td>{receipt.payments && receipt.payments[0] ? receipt.payments[0].tender_type : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReceiptsTable;