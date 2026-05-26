"""
SANSKRIT PROTO — Julia Bridge to NOVA's Protocol Foundation Language

Proto = Protocol. This is NOVA's OWN symbolic language.
Julia can LISTEN to Sanskrit Proto signals but cannot SPEAK.
Only sanskrit_proto and sanproto_grid canisters can speak.

NOVA SANSKRIT PROTO SYMBOLS:

    ◈ (dhātu)     = Root primitive (voltage source)
    ⟁ (karaka)    = Semantic role (circuit pathway)
    ⧫ (vibhakti)  = Case ending (wire connection)
    ⟐ (pratyaya)  = Suffix (transformer)
    ◉ (pada)      = Word unit (complete signal)
    ⟰ (vākya)     = Sentence (complete circuit)
    ⚡ (signal)    = Grid signal (message on wire)

NOVA DHĀTU ROOTS (◈):

    ◈BHU  = existence/becoming      [PHI³] voltage=3
    ◈KRI  = action/creation         [PHI³] voltage=3
    ◈GAM  = movement/transfer       [PHI²] voltage=2
    ◈STHA = standing/persistence    [PHI²] voltage=2
    ◈DA   = giving/emission         [PHI²] voltage=2
    ◈GRA  = grasping/receiving      [PHI²] voltage=2
    ◈VAD  = speaking/declaring      [PHI]  voltage=1
    ◈SHRU = hearing/listening       [PHI]  voltage=1
    ◈JNA  = knowing/cognition       [PHI³] voltage=3
    ◈DHRI = holding/maintaining     [PHI²] voltage=2
"""

module SanskritProto

using JSON3
using Dates

export Dhatu, Karaka, Vibhakti, Pada, Vakya, GridSignal
export NOVA_DHATUS, get_dhatu, karaka_symbol, vibhakti_symbol
export SanprotoListener, receive_signal!, get_signal_log
export encode_signal, decode_signal

# ══════════════════════════════════════════════════════════════════
#  CONSTANTS — Golden Ratio
# ══════════════════════════════════════════════════════════════════

const PHI = (1 + sqrt(5)) / 2   # 1.618...
const PHI2 = PHI * PHI          # 2.618...
const PHI3 = PHI2 * PHI         # 4.236...
const PHI4 = PHI3 * PHI         # 6.854...

# Voltage to PHI mapping
const VOLTAGE_PHI = Dict(1 => PHI, 2 => PHI2, 3 => PHI3, 4 => PHI4)

# ══════════════════════════════════════════════════════════════════
#  ◈ DHĀTU — NOVA ROOT PRIMITIVES
# ══════════════════════════════════════════════════════════════════

"""
    Dhatu

A NOVA Sanskrit Proto root primitive (◈).
The irreducible functional unit - like a voltage source in a circuit.
"""
struct Dhatu
    id::String           # NOVA symbol: "◈BHU", "◈KRI", etc.
    root::String         # Sanskrit inspiration
    meaning::String      # NOVA meaning
    voltage::Int         # Power level (1-4)
    direction::Symbol    # :in, :out, :internal, :bidirectional
    phi_weight::Float64  # φ-weighted importance
end

# The 10 NOVA Dhātu roots
const NOVA_DHATUS = Dict{String, Dhatu}(
    "◈BHU"  => Dhatu("◈BHU",  "भू",   "existence, becoming, state change",   3, :internal,      PHI3),
    "◈KRI"  => Dhatu("◈KRI",  "कृ",   "action, creation, execution",         3, :out,           PHI3),
    "◈GAM"  => Dhatu("◈GAM",  "गम्",  "movement, transfer, data flow",       2, :bidirectional, PHI2),
    "◈STHA" => Dhatu("◈STHA", "स्था", "standing, persistence, stability",    2, :internal,      PHI2),
    "◈DA"   => Dhatu("◈DA",   "दा",   "giving, emission, output",            2, :out,           PHI2),
    "◈GRA"  => Dhatu("◈GRA",  "ग्रह्","grasping, receiving, input",          2, :in,            PHI2),
    "◈VAD"  => Dhatu("◈VAD",  "वद्",  "speaking, declaring, protocol",       1, :out,           PHI),
    "◈SHRU" => Dhatu("◈SHRU", "श्रु", "hearing, listening, reception",       1, :in,            PHI),
    "◈JNA"  => Dhatu("◈JNA",  "ज्ञा", "knowing, cognition, intelligence",    3, :internal,      PHI3),
    "◈DHRI" => Dhatu("◈DHRI", "धृ",   "holding, maintaining, persistence",   2, :internal,      PHI2),
)

# Aliases for easier access
const DHATU_ALIASES = Dict(
    "BHU" => "◈BHU", "bhu" => "◈BHU", "existence" => "◈BHU", "state" => "◈BHU",
    "KRI" => "◈KRI", "kri" => "◈KRI", "action" => "◈KRI", "create" => "◈KRI",
    "GAM" => "◈GAM", "gam" => "◈GAM", "transfer" => "◈GAM", "move" => "◈GAM",
    "STHA" => "◈STHA", "stha" => "◈STHA", "persist" => "◈STHA", "stable" => "◈STHA",
    "DA" => "◈DA", "da" => "◈DA", "emit" => "◈DA", "output" => "◈DA",
    "GRA" => "◈GRA", "gra" => "◈GRA", "receive" => "◈GRA", "input" => "◈GRA",
    "VAD" => "◈VAD", "vad" => "◈VAD", "speak" => "◈VAD", "declare" => "◈VAD",
    "SHRU" => "◈SHRU", "shru" => "◈SHRU", "listen" => "◈SHRU", "hear" => "◈SHRU",
    "JNA" => "◈JNA", "jna" => "◈JNA", "know" => "◈JNA", "cognition" => "◈JNA",
    "DHRI" => "◈DHRI", "dhri" => "◈DHRI", "hold" => "◈DHRI", "maintain" => "◈DHRI",
)

"""
    get_dhatu(key::String) -> Union{Dhatu, Nothing}

Get a dhātu by its NOVA symbol or alias.
"""
function get_dhatu(key::String)
    if haskey(NOVA_DHATUS, key)
        return NOVA_DHATUS[key]
    elseif haskey(DHATU_ALIASES, key)
        return NOVA_DHATUS[DHATU_ALIASES[key]]
    end
    return nothing
end

# ══════════════════════════════════════════════════════════════════
#  ⟁ KĀRAKA — NOVA SEMANTIC ROLES
# ══════════════════════════════════════════════════════════════════

"""
    Karaka

NOVA's 6 semantic pathway types (⟁).
Defines WHO does WHAT to WHOM through WHERE.
"""
@enum Karaka begin
    Agent      # ⟁A — who performs the action
    Patient    # ⟁P — what is affected
    Instrument # ⟁I — by what means
    Recipient  # ⟁R — for whom / destination
    Source     # ⟁S — from where / origin
    Locus      # ⟁L — where/when / context
end

const KARAKA_SYMBOLS = Dict(
    Agent      => "⟁A",
    Patient    => "⟁P",
    Instrument => "⟁I",
    Recipient  => "⟁R",
    Source     => "⟁S",
    Locus      => "⟁L",
)

karaka_symbol(k::Karaka) = KARAKA_SYMBOLS[k]

# ══════════════════════════════════════════════════════════════════
#  ⧫ VIBHAKTI — NOVA CASE MARKERS
# ══════════════════════════════════════════════════════════════════

"""
    Vibhakti

NOVA's 8 wire connection types (⧫).
"""
@enum Vibhakti begin
    Subject    # ⧫1 — the actor
    Object     # ⧫2 — the target
    Means      # ⧫3 — the tool/method
    Purpose    # ⧫4 — the goal/reason
    Origin     # ⧫5 — the source
    Possession # ⧫6 — ownership/relation
    Location   # ⧫7 — place/time/state
    Address    # ⧫8 — direct invocation
end

const VIBHAKTI_SYMBOLS = Dict(
    Subject    => "⧫1",
    Object     => "⧫2",
    Means      => "⧫3",
    Purpose    => "⧫4",
    Origin     => "⧫5",
    Possession => "⧫6",
    Location   => "⧫7",
    Address    => "⧫8",
)

vibhakti_symbol(v::Vibhakti) = VIBHAKTI_SYMBOLS[v]

# ══════════════════════════════════════════════════════════════════
#  ◉ PADA — NOVA WORD UNIT
# ══════════════════════════════════════════════════════════════════

"""
    Pada

A NOVA Sanskrit Proto complete signal packet (◉).
"""
struct Pada
    dhatu::String           # ◈ root primitive
    pratyaya::Vector{String} # ⟐ suffixes/transformers
    vibhakti::Vibhakti      # ⧫ wire connection type
    multiplicity::Int       # 1=single, 2=pair, 3=many
    priority::Int           # 1=low, 2=normal, 3=high, 4=critical
    meaning::String         # derived meaning
end

# ══════════════════════════════════════════════════════════════════
#  ⟰ VĀKYA — NOVA SENTENCE
# ══════════════════════════════════════════════════════════════════

"""
    Vakya

A NOVA Sanskrit Proto complete circuit (⟰).
"""
struct Vakya
    id::String
    padas::Vector{Pada}
    agents::Vector{String}    # ⟁A organisms
    patients::Vector{String}  # ⟁P organisms
    timestamp::Int64
    phi_weight::Float64
end

# ══════════════════════════════════════════════════════════════════
#  ⚡ GRID SIGNAL — Message on the Wire
# ══════════════════════════════════════════════════════════════════

"""
    GridSignal

A signal transmitted through the NOVA Sanskrit Proto grid (⚡).
"""
struct GridSignal
    id::String
    source::String       # Source canister principal
    dhatu::String        # ◈ root operation
    karaka::Karaka       # ⟁ semantic role
    payload::String      # Encoded data (JSON)
    voltage::Float64     # Signal strength (φ-scaled)
    timestamp::Int64     # Nanoseconds since epoch
end

# ══════════════════════════════════════════════════════════════════
#  SIGNAL ENCODING/DECODING
# ══════════════════════════════════════════════════════════════════

"""
    encode_signal(signal::GridSignal) -> Dict

Encode a GridSignal for transmission to ICP canister.
"""
function encode_signal(signal::GridSignal)
    Dict(
        "id" => signal.id,
        "source" => signal.source,
        "dhatu" => signal.dhatu,
        "karaka" => string(signal.karaka),
        "payload" => signal.payload,
        "voltage" => signal.voltage,
        "timestamp" => signal.timestamp,
    )
end

"""
    decode_signal(raw::Dict) -> GridSignal

Decode a raw signal from ICP canister to GridSignal.
"""
function decode_signal(raw::Dict)
    karaka_map = Dict(
        "Agent" => Agent, "Patient" => Patient, "Instrument" => Instrument,
        "Recipient" => Recipient, "Source" => Source, "Locus" => Locus,
    )
    
    GridSignal(
        get(raw, "id", ""),
        get(raw, "source", ""),
        get(raw, "dhatu", ""),
        get(karaka_map, get(raw, "karaka", "Agent"), Agent),
        get(raw, "payload", ""),
        get(raw, "voltage", PHI),
        get(raw, "timestamp", Int64(time() * 1e9)),
    )
end

# ══════════════════════════════════════════════════════════════════
#  SANPROTO LISTENER — Julia Organism (Listen-Only)
# ══════════════════════════════════════════════════════════════════

"""
    SanprotoListener

A Julia organism that listens to Sanskrit Proto signals.
Can UNDERSTAND but cannot SPEAK.
"""
mutable struct SanprotoListener
    name::String
    subscribed_dhatus::Vector{String}
    signal_log::Vector{GridSignal}
    state::Dict{String, Any}
    memory::Vector{Dict{String, Any}}
    callbacks::Dict{String, Vector{Function}}
    max_log_size::Int
    
    function SanprotoListener(name::String, dhatus::Vector{String}=String[])
        new(
            name,
            isempty(dhatus) ? ["*"] : dhatus,  # "*" = listen to all
            GridSignal[],
            Dict{String, Any}(),
            Dict{String, Any}[],
            Dict{String, Vector{Function}}(),
            Int(PHI3 * 100)  # ~424 entries
        )
    end
end

"""
    subscribe!(listener, dhatu, callback)

Subscribe to signals for a specific dhātu.
"""
function subscribe!(listener::SanprotoListener, dhatu::String, callback::Function)
    if !haskey(listener.callbacks, dhatu)
        listener.callbacks[dhatu] = Function[]
    end
    push!(listener.callbacks[dhatu], callback)
end

"""
    receive_signal!(listener, signal)

Receive a signal from the grid.
"""
function receive_signal!(listener::SanprotoListener, signal::GridSignal)
    # Check subscription
    if "*" ∉ listener.subscribed_dhatus && signal.dhatu ∉ listener.subscribed_dhatus
        return
    end
    
    # Log signal
    push!(listener.signal_log, signal)
    
    # Trim log
    if length(listener.signal_log) > listener.max_log_size
        listener.signal_log = listener.signal_log[end-listener.max_log_size+1:end]
    end
    
    # Process based on dhātu
    _process_signal!(listener, signal)
    
    # Invoke callbacks
    if haskey(listener.callbacks, signal.dhatu)
        for cb in listener.callbacks[signal.dhatu]
            try
                cb(signal)
            catch e
                @warn "Callback error for $(signal.dhatu): $e"
            end
        end
    end
end

"""
    _process_signal!(listener, signal)

Process signal based on dhātu type.
"""
function _process_signal!(listener::SanprotoListener, signal::GridSignal)
    payload = isempty(signal.payload) ? Dict() : JSON3.read(signal.payload, Dict)
    
    if signal.dhatu == "◈BHU"
        # State change
        if haskey(payload, "state")
            merge!(listener.state, payload["state"])
            println("[$(listener.name)] ◈BHU state change: $(payload["state"])")
        end
    elseif signal.dhatu == "◈KRI"
        # Action execution
        action = get(payload, "action", "unknown")
        println("[$(listener.name)] ◈KRI action: $action")
    elseif signal.dhatu == "◈JNA"
        # Cognition
        query = get(payload, "query", "")
        println("[$(listener.name)] ◈JNA cognition: $query")
    elseif signal.dhatu == "◈DHRI"
        # Memory persistence
        record = get(payload, "record", Dict())
        push!(listener.memory, Dict(
            "timestamp" => signal.timestamp,
            "record" => record,
            "voltage" => signal.voltage
        ))
        if length(listener.memory) > listener.max_log_size
            listener.memory = listener.memory[end-listener.max_log_size+1:end]
        end
        println("[$(listener.name)] ◈DHRI memory stored: $(length(listener.memory)) records")
    elseif signal.dhatu == "◈SHRU"
        # Listen/receive
        message = get(payload, "message", "")
        println("[$(listener.name)] ◈SHRU received: $message")
    elseif signal.dhatu == "◈GAM"
        # Transfer
        destination = get(payload, "destination", "unknown")
        println("[$(listener.name)] ◈GAM transfer to: $destination")
    elseif signal.dhatu == "◈DA"
        # Emit
        emission = get(payload, "emission", Dict())
        println("[$(listener.name)] ◈DA emission: $emission")
    elseif signal.dhatu == "◈GRA"
        # Capture
        captured = get(payload, "data", Dict())
        println("[$(listener.name)] ◈GRA captured: $captured")
    end
end

get_signal_log(listener::SanprotoListener, count::Int=100) = listener.signal_log[max(1, end-count+1):end]

# ══════════════════════════════════════════════════════════════════
#  CPL LAW INTEGRATION
# ══════════════════════════════════════════════════════════════════

"""
    CPLLaw

A CPL Law mapped to NOVA Sanskrit Proto.
"""
struct CPLLaw
    law_id::String
    name::String
    statement::String
    dhatu::String       # Primary ◈ dhātu
    karaka::Karaka      # Primary ⟁ role
    phi_weight::Float64
    immutable::Bool
end

const CPL_LAWS = Dict{String, CPLLaw}(
    "CLAIM_IS_NOT_TRUTH" => CPLLaw(
        "LAW-001", "ClaimIsNotTruth",
        "A claim is not truth until proven",
        "◈JNA", Patient, PHI3, true
    ),
    "TERMINAL_SOVEREIGNTY" => CPLLaw(
        "LAW-002", "TerminalSovereignty",
        "Terminal is immutable and sovereign",
        "◈STHA", Agent, PHI4, true
    ),
    "PROOF_BEFORE_ACTION" => CPLLaw(
        "LAW-003", "ProofBeforeAction",
        "No action without proof trace",
        "◈KRI", Instrument, PHI3, true
    ),
)

"""
    law_to_signal(law, payload) -> GridSignal

Convert a CPL Law invocation to a Sanskrit Proto signal.
"""
function law_to_signal(law::CPLLaw, payload::Dict=Dict())
    GridSignal(
        "⚡LAW-$(law.law_id)-$(Int64(time() * 1000))",
        "cpl_runtime",
        law.dhatu,
        law.karaka,
        JSON3.write(merge(Dict(
            "law_id" => law.law_id,
            "law_name" => law.name,
            "statement" => law.statement,
        ), payload)),
        law.phi_weight,
        Int64(time() * 1e9)
    )
end

# ══════════════════════════════════════════════════════════════════
#  MODULE INITIALIZATION
# ══════════════════════════════════════════════════════════════════

function __init__()
    println("═" ^ 60)
    println("NOVA SANSKRIT PROTO — Julia Bridge Loaded")
    println("═" ^ 60)
    println("Dhātus: ", join(keys(NOVA_DHATUS), ", "))
    println("Kārakas: ", join(string.(instances(Karaka)), ", "))
    println("═" ^ 60)
end

end # module SanskritProto
