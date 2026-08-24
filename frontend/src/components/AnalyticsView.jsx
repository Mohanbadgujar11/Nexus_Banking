function AnalyticsView({ balance }) {
  const categories = [
    { name: 'Cloud Infrastructure & Engineering', amount: 3450.00, pct: 42, color: '#d4af37' },
    { name: 'Direct Payroll & Compensation', amount: 2800.00, pct: 34, color: '#a855f7' },
    { name: 'Treasury & Yield Reinvestment', amount: 1200.00, pct: 15, color: '#10b981' },
    { name: 'Merchant POS & Operational', amount: 750.00, pct: 9, color: '#6366f1' },
  ];

  const monthlyFlow = [
    { month: 'Apr', in: 18200, out: 6400 },
    { month: 'May', in: 21500, out: 7100 },
    { month: 'Jun', in: 24000, out: 8200 },
    { month: 'Jul', in: 28400, out: 7900 },
    { month: 'Aug', in: 32500, out: 8200 },
  ];

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-badge">Financial Intelligence</div>
        <h1 className="view-title">Cash Flow & Analytics</h1>
        <p className="view-subtitle">
          Real-time spending velocity, categorization intelligence, and predictive cash flow trajectories.
        </p>
      </div>

      {/* Top Metrics Row */}
      <div className="analytics-metrics-grid">
        <div className="lux-card metric-box">
          <span className="metric-lbl">Total Liquid Capital</span>
          <span className="metric-val gold-text">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="metric-trend green-text">↑ +18.4% vs last month</span>
        </div>

        <div className="lux-card metric-box">
          <span className="metric-lbl">Monthly Operating Inflow</span>
          <span className="metric-val">$32,500.00</span>
          <span className="metric-trend green-text">↑ +14.2% acceleration</span>
        </div>

        <div className="lux-card metric-box">
          <span className="metric-lbl">Monthly Net Outflow</span>
          <span className="metric-val">$8,200.00</span>
          <span className="metric-trend neutral-text">→ Under budget by 12%</span>
        </div>

        <div className="lux-card metric-box">
          <span className="metric-lbl">Capital Retention Rate</span>
          <span className="metric-val gold-text">74.8%</span>
          <span className="metric-trend green-text">★ Elite Tier Liquidity</span>
        </div>
      </div>

      <div className="analytics-layout-grid">
        {/* Visual Cash Flow Trajectory */}
        <div className="lux-card flow-chart-card">
          <div className="lux-card-header">
            <h3>5-Month Inflow vs Outflow Trajectory</h3>
            <p>Visualizing total capital retention trends</p>
          </div>

          <div className="bar-chart-container">
            {monthlyFlow.map((f) => (
              <div key={f.month} className="bar-group">
                <div className="bars-pair">
                  <div
                    className="chart-bar in-bar"
                    style={{ height: `${(f.in / 35000) * 160}px` }}
                    title={`Inflow: $${f.in.toLocaleString()}`}
                  ></div>
                  <div
                    className="chart-bar out-bar"
                    style={{ height: `${(f.out / 35000) * 160}px` }}
                    title={`Outflow: $${f.out.toLocaleString()}`}
                  ></div>
                </div>
                <span className="month-lbl">{f.month}</span>
              </div>
            ))}
          </div>

          <div className="chart-legend">
            <div className="legend-item"><span className="legend-dot in-dot"></span> Inflow Capital</div>
            <div className="legend-item"><span className="legend-dot out-dot"></span> Outflow Expenditures</div>
          </div>
        </div>

        {/* Categorized Expenses */}
        <div className="lux-card category-card">
          <div className="lux-card-header">
            <h3>Expenditure Allocation</h3>
            <p>Real-time categorized ledger disbursements</p>
          </div>

          <div className="category-list">
            {categories.map((cat) => (
              <div key={cat.name} className="cat-item">
                <div className="cat-header-row">
                  <span className="cat-name">{cat.name}</span>
                  <span className="cat-amt">${cat.amount.toLocaleString()} ({cat.pct}%)</span>
                </div>
                <div className="cat-progress-track">
                  <div
                    className="cat-progress-bar"
                    style={{ width: `${cat.pct}%`, background: cat.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsView;

