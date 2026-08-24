function Footer({ onNavigate }) {
  return (
    <footer className="banking-footer">
      <div className="footer-inner">
        {/* Top Branding & Status Row */}
        <div className="footer-top-row">
          <div className="footer-brand-summary">
            <div className="brand-group">
              <div className="brand-icon-box small">
                <span className="brand-dot"></span>
                <span className="brand-initial">N</span>
              </div>
              <span className="footer-brand-name">NEXUS FEDERAL RESERVE TRUST N.A.</span>
            </div>
            <p className="footer-tagline">
              Institutional core banking infrastructure and private wealth custody. Backed by real-time double-entry cryptographic ledgers, distributed settlement protocols, and multi-region statutory compliance.
            </p>
          </div>

          <div className="footer-status-badge">
            <span className="pulse-dot"></span>
            <span>All Global Core Clearing Systems Operational (99.999% SLA)</span>
          </div>
        </div>

        {/* Institutional Global Branches */}
        <div className="branches-grid">
          <div className="branch-item">
            <span className="branch-city">NEW YORK (HEADQUARTERS)</span>
            <span className="branch-addr">100 Wall Street, 42nd Floor, NY 10005</span>
          </div>
          <div className="branch-item">
            <span className="branch-city">LONDON CUSTODY</span>
            <span className="branch-addr">1 Canada Square, Canary Wharf, E14 5AA</span>
          </div>
          <div className="branch-item">
            <span className="branch-city">ZURICH PRIVATE WEALTH</span>
            <span className="branch-addr">Bahnhofstrasse 45, 8001 Zurich</span>
          </div>
          <div className="branch-item">
            <span className="branch-city">SINGAPORE TREASURY</span>
            <span className="branch-addr">Marina Bay Financial Centre Tower 2, 018983</span>
          </div>
        </div>

        {/* Links Grid */}
        <div className="footer-grid">
          <div className="footer-col">
            <h4>Banking Products</h4>
            <ul>
              <li><button type="button" className="footer-link-btn" onClick={() => onNavigate && onNavigate('accounts')}>Nexus Prime Checking</button></li>
              <li><button type="button" className="footer-link-btn" onClick={() => onNavigate && onNavigate('vault')}>High-Yield Vault (4.85% APY)</button></li>
              <li><button type="button" className="footer-link-btn" onClick={() => onNavigate && onNavigate('cards')}>Titanium Metal & Virtual Cards</button></li>
              <li><button type="button" className="footer-link-btn" onClick={() => onNavigate && onNavigate('transfers')}>SWIFT & Global Clearing Wires</button></li>
              <li><button type="button" className="footer-link-btn" onClick={() => onNavigate && onNavigate('accounts')}>Commercial Treasury</button></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Institutional Infrastructure</h4>
            <ul>
              <li><a href="#core-engine">High-Throughput Settlement Engine</a></li>
              <li><a href="#acid">Atomic Transaction Settlement Protocol</a></li>
              <li><a href="#api">Open Banking Interconnect Specifications</a></li>
              <li><a href="#cloud">Distributed Sovereign Cloud Nodes</a></li>
              <li><a href="#audit-log">Immutable Double-Entry Ledger Proof</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Security & Compliance</h4>
            <ul>
              <li><button type="button" className="footer-link-btn" onClick={() => onNavigate && onNavigate('security')}>Hardware Key Cryptography</button></li>
              <li><a href="#tls">256-Bit TLS In-Transit Encryption</a></li>
              <li><a href="#soc2">SOC-2 Type II Certified Audits</a></li>
              <li><a href="#iso">ISO/IEC 27001 Information Security</a></li>
              <li><a href="#pci">PCI-DSS Level 1 Merchant Clearing</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Regulatory Disclosures</h4>
            <ul>
              <li><a href="#fdic">Member FDIC (Insured to $2,500,000 via Sweep)</a></li>
              <li><a href="#routing">FedWire Routing: 021000089</a></li>
              <li><a href="#swift">SWIFT / BIC: NXUSUS33NYC</a></li>
              <li><a href="#privacy">Privacy Statement & Terms of Service</a></li>
              <li><a href="#support">24/7 Dedicated Client Concierge</a></li>
            </ul>
          </div>
        </div>

        {/* Regulatory Fine Print & Security Certifications */}
        <div className="footer-regulatory-disclaimer">
          <p>
            Banking services provided by Nexus Federal Reserve Trust N.A., Member FDIC. Deposits are FDIC-insured up to $250,000 per depositor, and up to $2,500,000 for insurable capacity through the Nexus Deposit Sweep Program. The Nexus Titanium Card is issued by Nexus Federal Trust N.A. pursuant to license from Mastercard International Incorporated.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-row">
          <div className="footer-copyright">
            © {new Date().getFullYear()} Nexus Federal Reserve Trust N.A. All rights reserved.
          </div>
          <div className="security-badges">
            <span className="sec-tag">🔒 256-Bit TLS</span>
            <span className="sec-tag">🛡 HSM Secured</span>
            <span className="sec-tag">🏛 FDIC Insured</span>
            <span className="sec-tag">⚡ Certified Core Ledger</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
