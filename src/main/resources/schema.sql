-- ============================================================================
-- NEXUS CORE BANKING SYSTEM - ENTERPRISE RELATIONAL SCHEMA DDL
-- Database: MySQL 8.0+ / MariaDB / ANSI SQL Compatible
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. USERS & IDENTITY MODULE
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS kyc_documents;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS cards;
DROP TABLE IF EXISTS ledger_entries;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS account_metadata;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS customer_profiles;
DROP TABLE IF EXISTS users;

-- 1.1 Master Users Table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL
);

CREATE INDEX idx_users_status_deleted ON users (status, is_deleted);

-- 1.2 Customer Profiles Table
CREATE TABLE customer_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(25) NOT NULL UNIQUE,
    date_of_birth VARCHAR(25) NOT NULL,
    tax_identifier_encrypted VARCHAR(255) NULL,
    tier VARCHAR(30) NOT NULL DEFAULT 'STANDARD',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_profiles_user FOREIGN KEY (user_id) 
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_customer_profiles_name ON customer_profiles (last_name, first_name);

-- 1.3 Physical & Corporate Addresses Table
CREATE TABLE addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    address_type VARCHAR(20) NOT NULL DEFAULT 'RESIDENTIAL',
    address_line1 VARCHAR(150) NOT NULL,
    address_line2 VARCHAR(150) NULL,
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'US',
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) 
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_addresses_user_primary ON addresses (user_id, is_primary);

-- ----------------------------------------------------------------------------
-- 2. ACCOUNTS MODULE
-- ----------------------------------------------------------------------------

-- 2.1 Core Banking Accounts Table
CREATE TABLE accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_number VARCHAR(25) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    account_type VARCHAR(30) NOT NULL DEFAULT 'CHECKING',
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    balance DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    available_balance DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) 
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_accounts_user_type ON accounts (user_id, account_type);
CREATE INDEX idx_accounts_status ON accounts (status);

-- 2.2 Account Routing & Clearing Metadata Table
CREATE TABLE account_metadata (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL UNIQUE,
    routing_number VARCHAR(20) NOT NULL DEFAULT '021000089',
    swift_bic VARCHAR(15) NOT NULL DEFAULT 'NXUSUS33NYC',
    iban VARCHAR(34) NULL UNIQUE,
    interest_rate_apy DECIMAL(6, 4) NOT NULL DEFAULT 0.0000,
    daily_transfer_limit DECIMAL(19, 4) NOT NULL DEFAULT 50000.0000,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_metadata_account FOREIGN KEY (account_id) 
        REFERENCES accounts (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ----------------------------------------------------------------------------
-- 3. TRANSACTIONS & DOUBLE-ENTRY LEDGER MODULE
-- ----------------------------------------------------------------------------

-- 3.1 Master Transaction Headers Table
CREATE TABLE transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_reference VARCHAR(64) NOT NULL UNIQUE,
    parent_transaction_id BIGINT NULL,
    channel VARCHAR(30) NOT NULL DEFAULT 'WEB',
    type VARCHAR(30) NOT NULL,
    total_amount DECIMAL(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'SETTLED',
    initiated_by_user_id BIGINT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_transactions_parent FOREIGN KEY (parent_transaction_id) 
        REFERENCES transactions (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_transactions_user FOREIGN KEY (initiated_by_user_id) 
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_transactions_created_at ON transactions (created_at);
CREATE INDEX idx_transactions_status ON transactions (status);

-- 3.2 Granular Double-Entry Ledger Entries Table
CREATE TABLE ledger_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    entry_type VARCHAR(10) NOT NULL,
    amount DECIMAL(19, 4) NOT NULL,
    balance_after DECIMAL(19, 4) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ledger_entries_transaction FOREIGN KEY (transaction_id) 
        REFERENCES transactions (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ledger_entries_account FOREIGN KEY (account_id) 
        REFERENCES accounts (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_ledger_account_created ON ledger_entries (account_id, created_at);
CREATE INDEX idx_ledger_transaction_id ON ledger_entries (transaction_id);

-- ----------------------------------------------------------------------------
-- 4. CARDS & PAYMENT INSTRUMENTS MODULE
-- ----------------------------------------------------------------------------

-- 4.1 Payment Cards Table
CREATE TABLE cards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    card_number_masked VARCHAR(20) NOT NULL,
    card_token_hash VARCHAR(128) NOT NULL UNIQUE,
    account_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    cardholder_name VARCHAR(100) NOT NULL,
    card_type VARCHAR(30) NOT NULL DEFAULT 'TITANIUM_PHYSICAL',
    expiration_date VARCHAR(20) NOT NULL,
    cvv_hash VARCHAR(255) NOT NULL,
    spending_limit_monthly DECIMAL(19, 4) NOT NULL DEFAULT 25000.0000,
    atm_withdrawal_limit_daily DECIMAL(19, 4) NOT NULL DEFAULT 5000.0000,
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    is_contactless_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_international_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_cards_account FOREIGN KEY (account_id) 
        REFERENCES accounts (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_cards_user FOREIGN KEY (user_id) 
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_cards_user_status ON cards (user_id, status);

-- ----------------------------------------------------------------------------
-- 5. AUDIT & COMPLIANCE MODULE
-- ----------------------------------------------------------------------------

-- 5.1 System Security Audit Logs Table
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_user_id BIGINT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(255) NULL,
    old_values TEXT NULL,
    new_values TEXT NULL,
    sha256_fingerprint VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_user_id) 
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_audit_logs_actor_created ON audit_logs (actor_user_id, created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id);

-- 5.2 KYC Documents Table
CREATE TABLE kyc_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    document_type VARCHAR(30) NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    document_file_url VARCHAR(255) NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verified_by_user_id BIGINT NULL,
    rejection_reason VARCHAR(255) NULL,
    verified_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_kyc_documents_user FOREIGN KEY (user_id) 
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_kyc_documents_verifier FOREIGN KEY (verified_by_user_id) 
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_kyc_user_status ON kyc_documents (user_id, verification_status);
