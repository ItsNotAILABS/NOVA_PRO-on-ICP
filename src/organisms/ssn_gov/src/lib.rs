///
/// SSN-GOV — Governance Weight Token
///
/// ICRC-1 compliant fungible token canister (Rust / ICP)
///
/// Part of the SSN Alpha Protocol — tradable sub-coin bound to SSN identity.
/// Mint authority: ssn_token canister ONLY
/// Transfer: Tradable WITHIN organism only (non-exportable)
/// Burn effect: +0.010 reputation per unit (10× more than WORK)
///
/// NON-EXPORTABLE: SSN-GOV cannot leave the organism boundary.
/// Transfers are restricted to principals that hold a valid SSN.
///
/// φ-based mint cap per epoch:
///   MintCap_GOV(ssn) = floor(ssn.stakeLocked^(1/φ) × ssn.reputation × 100_000)
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

use candid::{CandidType, Nat, Principal};
use ic_cdk::{init, post_upgrade, query, update};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;

// ═══════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const PHI: f64 = 1.618_033_988_749_895;
const PHI_INV: f64 = 0.618_033_988_749_895;
const TOKEN_NAME: &str = "SSN-GOV";
const TOKEN_SYMBOL: &str = "SSNG";
const TOKEN_DECIMALS: u8 = 8;
const TRANSFER_FEE: u128 = 0;
const MINT_CAP_SCALE: u128 = 100_000;
const BURN_REPUTATION_BONUS: f64 = 0.010; // 10× more than WORK
const EXPORTABLE: bool = false; // NON-EXPORTABLE — organism-internal only

// ═══════════════════════════════════════════════════════════════════
//  TYPES (ICRC-1)
// ═══════════════════════════════════════════════════════════════════

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Hash, PartialEq, Eq)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<[u8; 32]>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TransferArg {
    pub from_subaccount: Option<[u8; 32]>,
    pub to: Account,
    pub amount: Nat,
    pub fee: Option<Nat>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum TransferError {
    BadFee { expected_fee: Nat },
    BadBurn { min_burn_amount: Nat },
    InsufficientFunds { balance: Nat },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    Duplicate { duplicate_of: Nat },
    TemporarilyUnavailable,
    GenericError { error_code: Nat, message: String },
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct MintArg {
    pub to: Account,
    pub amount: Nat,
    pub ssn_id: u64,
    pub memo: Option<Vec<u8>>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct BurnArg {
    pub from_subaccount: Option<[u8; 32]>,
    pub amount: Nat,
    pub memo: Option<Vec<u8>>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum MetadataValue {
    Nat(Nat),
    Int(i128),
    Text(String),
    Blob(Vec<u8>),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TransactionRecord {
    pub kind: String,
    pub from: Option<Account>,
    pub to: Option<Account>,
    pub amount: Nat,
    pub timestamp: u64,
    pub ssn_id: Option<u64>,
}

// ═══════════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════════

#[derive(Serialize, Deserialize, Default)]
struct TokenState {
    balances: HashMap<String, u128>,
    total_supply: u128,
    minting_authority: Option<Principal>,
    ssn_bindings: HashMap<String, u64>,
    /// Allowlist of principals permitted to hold GOV tokens (SSN holders only)
    allowed_holders: Vec<String>,
    current_epoch: u64,
    tx_index: u64,
    tx_log: Vec<TransactionRecord>,
    frozen_accounts: Vec<String>,
}

thread_local! {
    static STATE: RefCell<TokenState> = RefCell::new(TokenState::default());
}

// ═══════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════

fn account_key(account: &Account) -> String {
    match &account.subaccount {
        Some(sub) => format!("{}:{}", account.owner, hex::encode(sub)),
        None => account.owner.to_string(),
    }
}

mod hex {
    pub fn encode(bytes: &[u8]) -> String {
        bytes.iter().map(|b| format!("{:02x}", b)).collect()
    }
}

fn now_nanos() -> u64 {
    ic_cdk::api::time()
}

fn compute_mint_cap(stake_locked: u128, reputation: f64) -> u128 {
    if stake_locked == 0 || reputation <= 0.0 {
        return 0;
    }
    let s = stake_locked as f64;
    let cap = s.powf(PHI_INV) * reputation * (MINT_CAP_SCALE as f64);
    cap as u128
}

fn is_frozen(account_key_str: &str) -> bool {
    STATE.with(|s| s.borrow().frozen_accounts.contains(&account_key_str.to_string()))
}

fn is_allowed_holder(account_key_str: &str) -> bool {
    STATE.with(|s| {
        let state = s.borrow();
        // Minting authority is always allowed
        if let Some(auth) = state.minting_authority {
            if account_key_str == auth.to_string() {
                return true;
            }
        }
        state.allowed_holders.contains(&account_key_str.to_string())
    })
}

// ═══════════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════════

#[derive(CandidType, Deserialize)]
pub struct InitArg {
    pub minting_authority: Principal,
}

#[init]
fn init(arg: InitArg) {
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        state.minting_authority = Some(arg.minting_authority);
    });
}

#[post_upgrade]
fn post_upgrade() {}

// ═══════════════════════════════════════════════════════════════════
//  ICRC-1 STANDARD QUERIES
// ═══════════════════════════════════════════════════════════════════

#[query]
fn icrc1_name() -> String {
    TOKEN_NAME.to_string()
}

#[query]
fn icrc1_symbol() -> String {
    TOKEN_SYMBOL.to_string()
}

#[query]
fn icrc1_decimals() -> u8 {
    TOKEN_DECIMALS
}

#[query]
fn icrc1_fee() -> Nat {
    Nat::from(TRANSFER_FEE)
}

#[query]
fn icrc1_total_supply() -> Nat {
    STATE.with(|s| Nat::from(s.borrow().total_supply))
}

#[query]
fn icrc1_minting_account() -> Option<Account> {
    STATE.with(|s| {
        s.borrow().minting_authority.map(|p| Account {
            owner: p,
            subaccount: None,
        })
    })
}

#[query]
fn icrc1_balance_of(account: Account) -> Nat {
    let key = account_key(&account);
    STATE.with(|s| Nat::from(*s.borrow().balances.get(&key).unwrap_or(&0)))
}

#[query]
fn icrc1_metadata() -> Vec<(String, MetadataValue)> {
    vec![
        ("icrc1:name".to_string(), MetadataValue::Text(TOKEN_NAME.to_string())),
        ("icrc1:symbol".to_string(), MetadataValue::Text(TOKEN_SYMBOL.to_string())),
        ("icrc1:decimals".to_string(), MetadataValue::Nat(Nat::from(TOKEN_DECIMALS as u64))),
        ("icrc1:fee".to_string(), MetadataValue::Nat(Nat::from(TRANSFER_FEE))),
        ("ssn:charter".to_string(), MetadataValue::Text("SSN-ALPHA-2026-MEDINA".to_string())),
        ("ssn:phi".to_string(), MetadataValue::Text(PHI.to_string())),
        ("ssn:type".to_string(), MetadataValue::Text("governance_weight".to_string())),
        ("ssn:exportable".to_string(), MetadataValue::Text("false".to_string())),
        ("ssn:burn_rep_bonus".to_string(), MetadataValue::Text(BURN_REPUTATION_BONUS.to_string())),
    ]
}

#[query]
fn icrc1_supported_standards() -> Vec<(String, String)> {
    vec![
        ("ICRC-1".to_string(), "https://github.com/dfinity/ICRC-1".to_string()),
    ]
}

// ═══════════════════════════════════════════════════════════════════
//  ICRC-1 TRANSFER (NON-EXPORTABLE — restricted to allowed holders)
// ═══════════════════════════════════════════════════════════════════

#[update]
fn icrc1_transfer(arg: TransferArg) -> Result<Nat, TransferError> {
    let caller = ic_cdk::caller();
    let from = Account {
        owner: caller,
        subaccount: arg.from_subaccount,
    };
    let from_key = account_key(&from);
    let to_key = account_key(&arg.to);

    // NON-EXPORTABLE: recipient must be an allowed holder (SSN holder)
    if !is_allowed_holder(&to_key) {
        return Err(TransferError::GenericError {
            error_code: Nat::from(403u64),
            message: "SSN-GOV is non-exportable: recipient must hold a valid SSN".to_string(),
        });
    }

    if is_frozen(&from_key) {
        return Err(TransferError::GenericError {
            error_code: Nat::from(403u64),
            message: "Account frozen — associated SSN is banned".to_string(),
        });
    }
    if is_frozen(&to_key) {
        return Err(TransferError::GenericError {
            error_code: Nat::from(403u64),
            message: "Recipient account frozen — associated SSN is banned".to_string(),
        });
    }

    if let Some(ref fee) = arg.fee {
        let fee_val: u128 = fee.0.clone().try_into().unwrap_or(u128::MAX);
        if fee_val != TRANSFER_FEE {
            return Err(TransferError::BadFee {
                expected_fee: Nat::from(TRANSFER_FEE),
            });
        }
    }

    let amount: u128 = arg.amount.0.try_into().unwrap_or(0);
    if amount == 0 {
        return Err(TransferError::GenericError {
            error_code: Nat::from(400u64),
            message: "Amount must be > 0".to_string(),
        });
    }

    STATE.with(|s| {
        let mut state = s.borrow_mut();

        let from_balance = *state.balances.get(&from_key).unwrap_or(&0);
        if from_balance < amount + TRANSFER_FEE {
            return Err(TransferError::InsufficientFunds {
                balance: Nat::from(from_balance),
            });
        }

        state.balances.insert(from_key.clone(), from_balance - amount - TRANSFER_FEE);
        let to_balance = *state.balances.get(&to_key).unwrap_or(&0);
        state.balances.insert(to_key.clone(), to_balance + amount);

        state.tx_index += 1;
        let tx = TransactionRecord {
            kind: "transfer".to_string(),
            from: Some(from),
            to: Some(arg.to),
            amount: Nat::from(amount),
            timestamp: now_nanos(),
            ssn_id: None,
        };
        state.tx_log.push(tx);

        if state.tx_log.len() > 10_000 {
            state.tx_log.drain(0..5_000);
        }

        Ok(Nat::from(state.tx_index))
    })
}

// ═══════════════════════════════════════════════════════════════════
//  MINTING (SSN Contract Authority Only)
// ═══════════════════════════════════════════════════════════════════

#[update]
fn mint(arg: MintArg) -> Result<Nat, TransferError> {
    let caller = ic_cdk::caller();

    STATE.with(|s| {
        let mut state = s.borrow_mut();

        match state.minting_authority {
            Some(auth) if auth == caller => {}
            _ => {
                return Err(TransferError::GenericError {
                    error_code: Nat::from(401u64),
                    message: "Only the SSN token canister may mint sub-coins".to_string(),
                });
            }
        }

        let amount: u128 = arg.amount.0.try_into().unwrap_or(0);
        if amount == 0 {
            return Err(TransferError::GenericError {
                error_code: Nat::from(400u64),
                message: "Amount must be > 0".to_string(),
            });
        }

        let to_key = account_key(&arg.to);

        // Auto-allow holder on mint (SSN contract vouches for them)
        if !state.allowed_holders.contains(&to_key) {
            state.allowed_holders.push(to_key.clone());
        }

        let balance = *state.balances.get(&to_key).unwrap_or(&0);
        state.balances.insert(to_key.clone(), balance + amount);
        state.total_supply += amount;
        state.ssn_bindings.insert(to_key, arg.ssn_id);

        state.tx_index += 1;
        let tx = TransactionRecord {
            kind: "mint".to_string(),
            from: None,
            to: Some(arg.to),
            amount: Nat::from(amount),
            timestamp: now_nanos(),
            ssn_id: Some(arg.ssn_id),
        };
        state.tx_log.push(tx);

        Ok(Nat::from(state.tx_index))
    })
}

// ═══════════════════════════════════════════════════════════════════
//  BURNING
// ═══════════════════════════════════════════════════════════════════

#[update]
fn burn(arg: BurnArg) -> Result<Nat, TransferError> {
    let caller = ic_cdk::caller();
    let from = Account {
        owner: caller,
        subaccount: arg.from_subaccount,
    };
    let from_key = account_key(&from);

    let amount: u128 = arg.amount.0.try_into().unwrap_or(0);
    if amount == 0 {
        return Err(TransferError::BadBurn {
            min_burn_amount: Nat::from(1u64),
        });
    }

    STATE.with(|s| {
        let mut state = s.borrow_mut();

        let balance = *state.balances.get(&from_key).unwrap_or(&0);
        if balance < amount {
            return Err(TransferError::InsufficientFunds {
                balance: Nat::from(balance),
            });
        }

        state.balances.insert(from_key.clone(), balance - amount);
        state.total_supply -= amount;

        state.tx_index += 1;
        let tx = TransactionRecord {
            kind: "burn".to_string(),
            from: Some(from),
            to: None,
            amount: Nat::from(amount),
            timestamp: now_nanos(),
            ssn_id: state.ssn_bindings.get(&from_key).copied(),
        };
        state.tx_log.push(tx);

        Ok(Nat::from(state.tx_index))
    })
}

// ═══════════════════════════════════════════════════════════════════
//  GOVERNANCE (Freeze/Unfreeze + Holder Management)
// ═══════════════════════════════════════════════════════════════════

#[update]
fn freeze_account(account: Account) -> Result<(), String> {
    let caller = ic_cdk::caller();
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        match state.minting_authority {
            Some(auth) if auth == caller => {
                let key = account_key(&account);
                if !state.frozen_accounts.contains(&key) {
                    state.frozen_accounts.push(key);
                }
                Ok(())
            }
            _ => Err("Only minting authority can freeze accounts".to_string()),
        }
    })
}

#[update]
fn unfreeze_account(account: Account) -> Result<(), String> {
    let caller = ic_cdk::caller();
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        match state.minting_authority {
            Some(auth) if auth == caller => {
                let key = account_key(&account);
                state.frozen_accounts.retain(|k| k != &key);
                Ok(())
            }
            _ => Err("Only minting authority can unfreeze accounts".to_string()),
        }
    })
}

/// Register a principal as an allowed GOV token holder (called by SSN contract)
#[update]
fn register_holder(account: Account) -> Result<(), String> {
    let caller = ic_cdk::caller();
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        match state.minting_authority {
            Some(auth) if auth == caller => {
                let key = account_key(&account);
                if !state.allowed_holders.contains(&key) {
                    state.allowed_holders.push(key);
                }
                Ok(())
            }
            _ => Err("Only minting authority can register holders".to_string()),
        }
    })
}

/// Remove a principal from allowed holders (governance revocation)
#[update]
fn revoke_holder(account: Account) -> Result<(), String> {
    let caller = ic_cdk::caller();
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        match state.minting_authority {
            Some(auth) if auth == caller => {
                let key = account_key(&account);
                state.allowed_holders.retain(|k| k != &key);
                Ok(())
            }
            _ => Err("Only minting authority can revoke holders".to_string()),
        }
    })
}

// ═══════════════════════════════════════════════════════════════════
//  SSN-SPECIFIC QUERIES
// ═══════════════════════════════════════════════════════════════════

#[query]
fn get_ssn_binding(account: Account) -> Option<u64> {
    let key = account_key(&account);
    STATE.with(|s| s.borrow().ssn_bindings.get(&key).copied())
}

#[query]
fn is_account_frozen(account: Account) -> bool {
    let key = account_key(&account);
    is_frozen(&key)
}

#[query]
fn is_holder_allowed(account: Account) -> bool {
    let key = account_key(&account);
    is_allowed_holder(&key)
}

#[query]
fn is_exportable() -> bool {
    EXPORTABLE
}

#[query]
fn get_mint_cap(stake_locked: u128, reputation: f64) -> Nat {
    Nat::from(compute_mint_cap(stake_locked, reputation))
}

#[query]
fn get_transaction_count() -> u64 {
    STATE.with(|s| s.borrow().tx_index)
}

#[query]
fn get_allowed_holder_count() -> u64 {
    STATE.with(|s| s.borrow().allowed_holders.len() as u64)
}

#[query]
fn health() -> String {
    STATE.with(|s| {
        let state = s.borrow();
        format!(
            "{} | Supply: {} | Holders: {} | Txns: {} | Non-exportable | φ-powered | burn_bonus: {}",
            TOKEN_NAME,
            state.total_supply,
            state.allowed_holders.len(),
            state.tx_index,
            BURN_REPUTATION_BONUS
        )
    })
}

// ═══════════════════════════════════════════════════════════════════
//  CANDID EXPORT
// ═══════════════════════════════════════════════════════════════════

ic_cdk::export_candid!();
