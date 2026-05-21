"""
TypeBridge — Julia Type Serialization for Candid/Motoko/JavaScript Interop

Provides complete bidirectional type mapping:
  Julia Float64 ↔ Candid float64 ↔ Motoko Float ↔ JavaScript number

All conversions are isomorphic (lossless roundtrip).
"""

module TypeBridge

using JSON3
using Dates

export to_candid, from_candid, CandidValue, CandidType
export encode_matrix, decode_matrix
export PhiWeighted, Point3D, CILEmission

# ══════════════════════════════════════════════════════════════════
#  CONSTANTS
# ══════════════════════════════════════════════════════════════════

const PHI = (1 + sqrt(5)) / 2
const PHI2 = PHI * PHI
const PHI3 = PHI2 * PHI
const PHI4 = PHI3 * PHI

# Nanoseconds per millisecond (IC uses nanoseconds)
const NS_PER_MS = 1_000_000

# ══════════════════════════════════════════════════════════════════
#  CANDID TYPE TAGS
# ══════════════════════════════════════════════════════════════════

@enum CandidType begin
    CT_NULL
    CT_BOOL
    CT_NAT
    CT_NAT8
    CT_NAT16
    CT_NAT32
    CT_NAT64
    CT_INT
    CT_INT8
    CT_INT16
    CT_INT32
    CT_INT64
    CT_FLOAT32
    CT_FLOAT64
    CT_TEXT
    CT_BLOB
    CT_OPT
    CT_VEC
    CT_RECORD
    CT_VARIANT
    CT_PRINCIPAL
end

# ══════════════════════════════════════════════════════════════════
#  CANDID VALUE WRAPPER
# ══════════════════════════════════════════════════════════════════

"""
Represents a Candid-encoded value with type information.
"""
struct CandidValue
    type::CandidType
    value::Any
    fields::Union{Nothing, Dict{Symbol, CandidValue}}  # For records
    tag::Union{Nothing, Symbol}                         # For variants
end

CandidValue(t::CandidType, v) = CandidValue(t, v, nothing, nothing)
CandidValue(t::CandidType, v, fields) = CandidValue(t, v, fields, nothing)

# ══════════════════════════════════════════════════════════════════
#  NOVA PROTOCOL TYPES
# ══════════════════════════════════════════════════════════════════

"""
φ-weighted value for golden ratio priority/scoring.
"""
struct PhiWeighted{T}
    value::T
    weight::Float64
end

PhiWeighted(v::T) where T = PhiWeighted{T}(v, 1.0)
PhiWeighted(v::T, rank::Int) where T = PhiWeighted{T}(v, PHI^rank)

"""
3D coordinate point (common in spatial calculations).
"""
struct Point3D
    x::Float64
    y::Float64
    z::Float64
end

"""
Cognitive Internal Language emission from an organism.
"""
struct CILEmission
    organism_id::String
    timestamp_ns::Int64
    thought::String
    confidence::Float64
    phi_weight::Float64
    biorhythm::Float64
end

# ══════════════════════════════════════════════════════════════════
#  TO CANDID — Julia → Wire Format
# ══════════════════════════════════════════════════════════════════

"""
    to_candid(x) → CandidValue

Encode a Julia value to Candid-compatible representation.
"""
function to_candid end

# Primitives
to_candid(::Nothing) = CandidValue(CT_NULL, nothing)
to_candid(x::Bool) = CandidValue(CT_BOOL, x)
to_candid(x::Int8) = CandidValue(CT_INT8, x)
to_candid(x::Int16) = CandidValue(CT_INT16, x)
to_candid(x::Int32) = CandidValue(CT_INT32, x)
to_candid(x::Int64) = CandidValue(CT_INT64, x)
to_candid(x::Int) = CandidValue(CT_INT, x)
to_candid(x::UInt8) = CandidValue(CT_NAT8, x)
to_candid(x::UInt16) = CandidValue(CT_NAT16, x)
to_candid(x::UInt32) = CandidValue(CT_NAT32, x)
to_candid(x::UInt64) = CandidValue(CT_NAT64, x)
to_candid(x::Float32) = CandidValue(CT_FLOAT32, x)
to_candid(x::Float64) = CandidValue(CT_FLOAT64, x)
to_candid(x::String) = CandidValue(CT_TEXT, x)

# Blob (byte array)
to_candid(x::Vector{UInt8}) = CandidValue(CT_BLOB, x)

# Optional
to_candid(x::Union{T, Nothing}) where T = 
    x === nothing ? CandidValue(CT_OPT, nothing) : CandidValue(CT_OPT, to_candid(x))

# Vector
function to_candid(x::Vector{T}) where T
    # Special case: UInt8 vectors become blobs
    if T === UInt8
        return CandidValue(CT_BLOB, x)
    end
    encoded = [to_candid(v) for v in x]
    CandidValue(CT_VEC, encoded)
end

# Tuple (fixed-size heterogeneous)
function to_candid(x::Tuple)
    fields = Dict{Symbol, CandidValue}()
    for (i, v) in enumerate(x)
        fields[Symbol("_$i")] = to_candid(v)
    end
    CandidValue(CT_RECORD, nothing, fields)
end

# DateTime → nanoseconds since UNIX epoch
function to_candid(x::DateTime)
    ms = Dates.datetime2unix(x) * 1000
    ns = Int64(round(ms * NS_PER_MS))
    CandidValue(CT_INT64, ns)
end

# ══════════════════════════════════════════════════════════════════
#  NOVA TYPE ENCODING
# ══════════════════════════════════════════════════════════════════

function to_candid(x::PhiWeighted{T}) where T
    fields = Dict{Symbol, CandidValue}(
        :value => to_candid(x.value),
        :weight => to_candid(x.weight)
    )
    CandidValue(CT_RECORD, nothing, fields)
end

function to_candid(x::Point3D)
    fields = Dict{Symbol, CandidValue}(
        :x => to_candid(x.x),
        :y => to_candid(x.y),
        :z => to_candid(x.z)
    )
    CandidValue(CT_RECORD, nothing, fields)
end

function to_candid(x::CILEmission)
    fields = Dict{Symbol, CandidValue}(
        :organism_id => to_candid(x.organism_id),
        :timestamp_ns => to_candid(x.timestamp_ns),
        :thought => to_candid(x.thought),
        :confidence => to_candid(x.confidence),
        :phi_weight => to_candid(x.phi_weight),
        :biorhythm => to_candid(x.biorhythm)
    )
    CandidValue(CT_RECORD, nothing, fields)
end

# ══════════════════════════════════════════════════════════════════
#  FROM CANDID — Wire Format → Julia
# ══════════════════════════════════════════════════════════════════

"""
    from_candid(cv::CandidValue, T::Type) → T

Decode a Candid value to a specific Julia type.
"""
function from_candid end

from_candid(cv::CandidValue, ::Type{Nothing}) = nothing
from_candid(cv::CandidValue, ::Type{Bool}) = cv.value::Bool
from_candid(cv::CandidValue, ::Type{Int8}) = cv.value::Int8
from_candid(cv::CandidValue, ::Type{Int16}) = cv.value::Int16
from_candid(cv::CandidValue, ::Type{Int32}) = cv.value::Int32
from_candid(cv::CandidValue, ::Type{Int64}) = cv.value::Int64
from_candid(cv::CandidValue, ::Type{Int}) = cv.value::Int
from_candid(cv::CandidValue, ::Type{UInt8}) = cv.value::UInt8
from_candid(cv::CandidValue, ::Type{UInt16}) = cv.value::UInt16
from_candid(cv::CandidValue, ::Type{UInt32}) = cv.value::UInt32
from_candid(cv::CandidValue, ::Type{UInt64}) = cv.value::UInt64
from_candid(cv::CandidValue, ::Type{Float32}) = cv.value::Float32
from_candid(cv::CandidValue, ::Type{Float64}) = cv.value::Float64
from_candid(cv::CandidValue, ::Type{String}) = cv.value::String

# Blob
from_candid(cv::CandidValue, ::Type{Vector{UInt8}}) = cv.value::Vector{UInt8}

# Optional
function from_candid(cv::CandidValue, ::Type{Union{T, Nothing}}) where T
    cv.value === nothing ? nothing : from_candid(cv.value, T)
end

# Vector
function from_candid(cv::CandidValue, ::Type{Vector{T}}) where T
    [from_candid(v, T) for v in cv.value]
end

# DateTime from nanoseconds
function from_candid(cv::CandidValue, ::Type{DateTime})
    ns = cv.value::Int64
    ms = ns / NS_PER_MS
    Dates.unix2datetime(ms / 1000)
end

# ══════════════════════════════════════════════════════════════════
#  NOVA TYPE DECODING
# ══════════════════════════════════════════════════════════════════

function from_candid(cv::CandidValue, ::Type{PhiWeighted{T}}) where T
    PhiWeighted{T}(
        from_candid(cv.fields[:value], T),
        from_candid(cv.fields[:weight], Float64)
    )
end

function from_candid(cv::CandidValue, ::Type{Point3D})
    Point3D(
        from_candid(cv.fields[:x], Float64),
        from_candid(cv.fields[:y], Float64),
        from_candid(cv.fields[:z], Float64)
    )
end

function from_candid(cv::CandidValue, ::Type{CILEmission})
    CILEmission(
        from_candid(cv.fields[:organism_id], String),
        from_candid(cv.fields[:timestamp_ns], Int64),
        from_candid(cv.fields[:thought], String),
        from_candid(cv.fields[:confidence], Float64),
        from_candid(cv.fields[:phi_weight], Float64),
        from_candid(cv.fields[:biorhythm], Float64)
    )
end

# ══════════════════════════════════════════════════════════════════
#  MATRIX ENCODING — Column-Major ↔ Row-Major
# ══════════════════════════════════════════════════════════════════

"""
    encode_matrix(m::Matrix{Float64}) → Dict

Encode a Julia matrix (column-major) for JavaScript (row-major) consumption.
"""
function encode_matrix(m::Matrix{Float64})
    rows, cols = size(m)
    # Convert column-major to row-major
    data = Vector{Float64}(undef, rows * cols)
    for i in 1:rows
        for j in 1:cols
            data[(i-1)*cols + j] = m[i, j]
        end
    end
    Dict(
        "data" => data,
        "rows" => rows,
        "cols" => cols,
        "order" => "row-major"
    )
end

"""
    decode_matrix(d::Dict) → Matrix{Float64}

Decode a row-major matrix from JavaScript to Julia column-major Matrix.
"""
function decode_matrix(d::Dict)
    data = d["data"]
    rows = d["rows"]
    cols = d["cols"]
    order = get(d, "order", "row-major")
    
    m = Matrix{Float64}(undef, rows, cols)
    
    if order == "row-major"
        for i in 1:rows
            for j in 1:cols
                m[i, j] = data[(i-1)*cols + j]
            end
        end
    else  # column-major (already Julia format)
        for j in 1:cols
            for i in 1:rows
                m[i, j] = data[(j-1)*rows + i]
            end
        end
    end
    
    m
end

# ══════════════════════════════════════════════════════════════════
#  JSON SERIALIZATION (Debug / External APIs)
# ══════════════════════════════════════════════════════════════════

"""
    to_json(cv::CandidValue) → String

Serialize Candid value to JSON with type hints.
"""
function to_json(cv::CandidValue)
    JSON3.write(candid_to_dict(cv))
end

function candid_to_dict(cv::CandidValue)
    if cv.type == CT_NULL
        return nothing
    elseif cv.type == CT_RECORD && cv.fields !== nothing
        result = Dict{String, Any}()
        for (k, v) in cv.fields
            result[String(k)] = candid_to_dict(v)
        end
        return result
    elseif cv.type == CT_VEC
        return [candid_to_dict(v) for v in cv.value]
    elseif cv.type == CT_OPT
        return cv.value === nothing ? nothing : candid_to_dict(cv.value)
    elseif cv.type == CT_BLOB
        # Base64 encode bytes for JSON
        return Dict("_type" => "blob", "_data" => Base64.base64encode(cv.value))
    else
        return cv.value
    end
end

"""
    from_json(json::String, T::Type) → T

Deserialize JSON to a Julia type.
"""
function from_json(json::String, T::Type)
    d = JSON3.read(json)
    dict_to_julia(d, T)
end

function dict_to_julia(d, ::Type{T}) where T
    # Simple types pass through
    if T <: Union{Bool, Int8, Int16, Int32, Int64, Int, UInt8, UInt16, UInt32, UInt64, Float32, Float64, String}
        return convert(T, d)
    end
    
    # For complex types, use from_candid with constructed CandidValue
    error("Direct JSON→Julia conversion not implemented for $T. Use Candid path.")
end

# ══════════════════════════════════════════════════════════════════
#  ROUNDTRIP VALIDATION
# ══════════════════════════════════════════════════════════════════

"""
    validate_roundtrip(x::T) → Bool where T

Validate that a value survives encode→decode roundtrip.
"""
function validate_roundtrip(x::T) where T
    encoded = to_candid(x)
    decoded = from_candid(encoded, T)
    
    if T <: AbstractFloat
        # Handle NaN special case
        if isnan(x) && isnan(decoded)
            return true
        end
    end
    
    return decoded == x
end

"""
    validate_float64_edge_cases() → Bool

Validate all Float64 edge cases survive roundtrip.
"""
function validate_float64_edge_cases()
    cases = [
        0.0,
        -0.0,
        1.0,
        -1.0,
        π,
        ℯ,
        PHI,
        Inf,
        -Inf,
        NaN,
        floatmin(Float64),
        floatmax(Float64),
        eps(Float64),
        prevfloat(0.0),  # Largest negative subnormal
        nextfloat(0.0),  # Smallest positive subnormal
    ]
    
    all(validate_roundtrip(c) for c in cases)
end

# ══════════════════════════════════════════════════════════════════
#  MODULE INITIALIZATION
# ══════════════════════════════════════════════════════════════════

function __init__()
    # Validate type bridge on module load
    if !validate_float64_edge_cases()
        @warn "TypeBridge: Float64 edge case validation failed!"
    end
end

end # module TypeBridge
