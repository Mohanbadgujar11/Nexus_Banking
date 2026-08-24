import { useState } from 'react';

function VaultView() {
  const [initialDeposit, setInitialDeposit] = useState(10450);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [years, setYears] = useState(3);
  const apy = 0.0485; // 4.85%

  // Compound Interest Calculation: A = P(1 + r/n)^(nt) + PMT * [((1 + r/n)^(nt) - 1) / (r/n)]
  const calculateGrowth = (P, PMT, t, r) => {
    const n = 12; // Compounded monthly/daily equivalent
    const ratePerPeriod = r / n;
    const totalPeriods = n * t;

    const futureValuePrincipal = P * Math.pow(1 + ratePerPeriod, totalPeriods);
    const futureValueSeries = PMT * ((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod);
    const total = futureValuePrincipal + futureValueSeries;
    const totalContributed = P + PMT * totalPeriods;
    const interestEarned = total - totalContributed;

    return {
      total: Math.round(total),
      contributed: Math.round(totalContributed),
      interest: Math.round(interestEarned),
    };
  };

  const projection = calculateGrowth(initialDeposit, monthlyContribution, years, apy);

  const vaults = [
    { id: 1, name: 'Primary Wealth Vault', balance: 10450, target: 25000, apy: '4.85%', icon: '🏛' },
    { id: 2, name: 'Real Estate Opportunity Vault', balance: 45000, target: 100000, apy: '4.85%', icon: '🏢' },
    { id: 3, name: 'Corporate Tax Reserve', balance: 18500, target: 20000, apy: '4.85%', icon: '🛡' },
  ];

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-badge">High-Yield Wealth Vaults</div>
        <h1 className="view-title">Compound Growth & Vaults</h1>
        <p className="view-subtitle">
          Earn an industry-leading 4.85% APY compounding daily with zero lock-in penalties and automatic FDIC sweep protection.
        </p>
      </div>

      <div className="vault-layout-grid">
        {/* Compound Interest Interactive Simulator */}
        <div className="lux-card compound-card">
          <div className="lux-card-header">
            <div>
              <h3>Interactive 4.85% APY Wealth Calculator</h3>
              <p>Simulate portfolio growth with daily compounded returns.</p>
            </div>
            <span className="apy-glow-pill">4.85% Current APY</span>
          </div>

          <div className="calc-controls-grid">
            <div className="calc-control-item">
              <div className="calc-lbl-row">
                <label htmlFor="init-dep">Initial Capital</label>
                <span className="calc-val-display">${initialDeposit.toLocaleString()}</span>
              </div>
              <input
                id="init-dep"
                type="range"
                min="1000"
                max="250000"
                step="1000"
                value={initialDeposit}
                onChange={(e) => setInitialDeposit(parseInt(e.target.value, 10))}
                className="lux-slider"
              />
            </div>

            <div className="calc-control-item">
              <div className="calc-lbl-row">
                <label htmlFor="mo-contrib">Monthly Deposit</label>
                <span className="calc-val-display">${monthlyContribution.toLocaleString()} / mo</span>
              </div>
              <input
                id="mo-contrib"
                type="range"
                min="0"
                max="10000"
                step="100"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(parseInt(e.target.value, 10))}
                className="lux-slider"
              />
            </div>

            <div className="calc-control-item">
              <div className="calc-lbl-row">
                <label>Time Horizon</label>
                <span className="calc-val-display">{years} Years</span>
              </div>
              <div className="year-selector-btns">
                {[1, 2, 3, 5, 10].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    className={`year-btn ${years === yr ? 'active' : ''}`}
                    onClick={() => setYears(yr)}
                  >
                    {yr} yr{yr > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Projected Growth Numbers Display */}
          <div className="projection-results-box">
            <div className="proj-item main-proj">
              <span className="proj-label">Estimated Total Balance</span>
              <span className="proj-num gold-text">
                ${projection.total.toLocaleString()}
              </span>
            </div>

            <div className="proj-item">
              <span className="proj-label">Principal Deposited</span>
              <span className="proj-num">
                ${projection.contributed.toLocaleString()}
              </span>
            </div>

            <div className="proj-item">
              <span className="proj-label">Compounded Interest Earned</span>
              <span className="proj-num green-text">
                +${projection.interest.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Existing Vaults Breakdown */}
        <div className="lux-card vaults-status-card">
          <div className="lux-card-header">
            <h3>Active Goal Vaults</h3>
            <p>Targeted savings pots compounding in real-time</p>
          </div>

          <div className="vaults-list">
            {vaults.map((v) => {
              const pct = Math.min(100, Math.round((v.balance / v.target) * 100));
              return (
                <div key={v.id} className="vault-item-box">
                  <div className="vault-top-info">
                    <div className="vault-name-group">
                      <span className="vault-icon">{v.icon}</span>
                      <div>
                        <h4>{v.name}</h4>
                        <span className="vault-target-txt">
                          ${v.balance.toLocaleString()} of ${v.target.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                    </div>
                    <span className="vault-apy-tag">{v.apy} APY</span>
                  </div>

                  <div className="vault-progress-bar">
                    <div className="vault-progress-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="vault-footer-cta">
            <button type="button" className="lux-btn-primary full-width" onClick={() => alert('New Goal Vault creation modal initialized.')}>
              + Create New Dedicated Goal Vault
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VaultView;

