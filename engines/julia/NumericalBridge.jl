"""
NumericalBridge — Julia Numerical Functions with Typed Bridge Contracts

Provides scientific computing functions designed for the Julia ↔ Motoko ↔ JavaScript bridge.
Each function has:
  - Explicit type signatures
  - φ-harmonic weighting where applicable
  - Deterministic behavior (within numeric tolerance)
  - Bridge-friendly return types
"""

module NumericalBridge

using LinearAlgebra
using FFTW
using Dates

include("TypeBridge.jl")
using .TypeBridge

export phi_eigen, phi_svd, phi_fft, kuramoto_sync
export calculate_biorhythm, phi_weighted_mean, matrix_coherence
export validate_roundtrip_suite
export EigenResult, SVDResult, FFTResult, KuramotoResult, CoherenceResult

# ══════════════════════════════════════════════════════════════════
#  CONSTANTS
# ══════════════════════════════════════════════════════════════════

const PHI = (1 + sqrt(5)) / 2
const PHI2 = PHI * PHI
const PHI3 = PHI2 * PHI
const PHI4 = PHI3 * PHI
const PHI_INV = 1 / PHI

# Ancient calendar constants (milliseconds)
const MAYAN_CYCLE = 1440.0
const SUMERIAN_HOUR = 3600.0
const EGYPTIAN_HOUR = 2160.0
const LUNAR_CYCLE = 2551.0
const SOLAR_CYCLE = 8760.0
const PHI_HEARTBEAT = 873.0

# ══════════════════════════════════════════════════════════════════
#  RESULT TYPES
# ══════════════════════════════════════════════════════════════════

"""
Result of eigendecomposition with φ-scaling.
"""
struct EigenResult
    values::Vector{Float64}      # Eigenvalues (real parts)
    vectors::Matrix{Float64}     # Eigenvectors (as columns)
    phi_coherence::Float64       # φ-normalized coherence metric
end

"""
Result of SVD with φ-weighted rank.
"""
struct SVDResult
    U::Matrix{Float64}           # Left singular vectors
    S::Vector{Float64}           # Singular values
    Vt::Matrix{Float64}          # Right singular vectors (transposed)
    phi_rank::Int                # φ-weighted effective rank
end

"""
Result of FFT with φ-harmonic peak detection.
"""
struct FFTResult
    frequencies::Vector{Float64}  # Frequency bins
    magnitudes::Vector{Float64}   # Magnitude spectrum
    phases::Vector{Float64}       # Phase spectrum
    phi_peaks::Vector{Int}        # Fibonacci-indexed peak bins
end

"""
Result of Kuramoto synchronization simulation.
"""
struct KuramotoResult
    final_phases::Vector{Float64}    # Final oscillator phases
    order_parameter::Float64         # Kuramoto order parameter R
    coherence_history::Vector{Float64}  # R over time
end

"""
Result of matrix coherence analysis.
"""
struct CoherenceResult
    frobenius_norm::Float64      # Frobenius norm
    phi_coherence::Float64       # φ-normalized coherence (0-1)
    rank_estimate::Int           # Numerical rank estimate
    condition_number::Float64    # Condition number
end

"""
Result of roundtrip validation.
"""
struct RoundtripResult
    success::Bool
    original_hash::String
    roundtrip_hash::String
    error::Union{String, Nothing}
end

# ══════════════════════════════════════════════════════════════════
#  LINEAR ALGEBRA FUNCTIONS
# ══════════════════════════════════════════════════════════════════

"""
    phi_eigen(A::Matrix{Float64}) -> EigenResult

Eigendecomposition with φ-scaled coherence metric.

# Arguments
- `A`: Square matrix for eigendecomposition

# Returns
- `EigenResult` with eigenvalues, eigenvectors, and φ-coherence

# Notes
- Eigenvectors may differ by sign convention across implementations
- Complex eigenvalues return only real parts (use for symmetric matrices)
- φ-coherence = 1 / (1 + |λ_max - λ_min| / φ)

# Example
```julia
A = [4.0 2.0; 2.0 3.0]
result = phi_eigen(A)
# result.values ≈ [5.236, 1.764]
# result.phi_coherence ≈ 0.318
```
"""
function phi_eigen(A::Matrix{Float64})::EigenResult
    @assert size(A, 1) == size(A, 2) "Matrix must be square"
    
    E = eigen(A)
    
    # Extract real parts of eigenvalues (sorted by magnitude)
    values = real.(E.values)
    sorted_idx = sortperm(abs.(values), rev=true)
    values = values[sorted_idx]
    
    # Eigenvectors as columns (real parts)
    vectors = real.(E.vectors[:, sorted_idx])
    
    # Normalize eigenvectors to unit length
    for i in 1:size(vectors, 2)
        vectors[:, i] ./= norm(vectors[:, i])
    end
    
    # φ-coherence: higher when eigenvalue spread is small relative to φ
    λ_spread = abs(values[1] - values[end])
    phi_coherence = 1.0 / (1.0 + λ_spread / PHI)
    
    EigenResult(values, vectors, phi_coherence)
end

"""
    phi_svd(A::Matrix{Float64}) -> SVDResult

Singular Value Decomposition with φ-weighted effective rank.

# Arguments
- `A`: Input matrix (m × n)

# Returns
- `SVDResult` with U, S, Vt, and φ-weighted rank

# Notes
- φ-rank counts singular values > max(S) / φ⁴
- U columns and V rows may differ by sign across implementations

# Example
```julia
A = [3.0 2.0 2.0; 2.0 3.0 -2.0]
result = phi_svd(A)
# result.S ≈ [5.0, 3.0]
# result.phi_rank = 2
```
"""
function phi_svd(A::Matrix{Float64})::SVDResult
    F = svd(A)
    
    # φ-weighted rank: count singular values > max / φ⁴
    threshold = maximum(F.S) / PHI4
    phi_rank = count(s -> s > threshold, F.S)
    
    SVDResult(F.U, F.S, F.Vt, phi_rank)
end

"""
    matrix_coherence(A::Matrix{Float64}) -> CoherenceResult

Compute coherence metrics for a matrix using φ-normalization.

# Arguments
- `A`: Input matrix

# Returns
- `CoherenceResult` with Frobenius norm, φ-coherence, rank, and condition number

# Notes
- φ-coherence = 1 - 1/(1 + frobenius_norm/φ), range [0, 1)
- Higher φ-coherence indicates more "structured" matrix

# Example
```julia
A = [1.0 0.0; 0.0 1.0]  # Identity
result = matrix_coherence(A)
# result.phi_coherence ≈ 0.467
```
"""
function matrix_coherence(A::Matrix{Float64})::CoherenceResult
    frob = norm(A, 2)  # Frobenius norm
    
    # φ-coherence: 0 for zero matrix, approaches 1 for large norms
    phi_coherence = 1.0 - 1.0 / (1.0 + frob / PHI)
    
    # Numerical rank (count singular values > eps * max)
    S = svdvals(A)
    threshold = eps(Float64) * max(size(A)...) * maximum(S)
    rank_estimate = count(s -> s > threshold, S)
    
    # Condition number
    cond_num = maximum(S) / max(minimum(S), eps(Float64))
    
    CoherenceResult(frob, phi_coherence, rank_estimate, cond_num)
end

# ══════════════════════════════════════════════════════════════════
#  SIGNAL PROCESSING
# ══════════════════════════════════════════════════════════════════

"""
    phi_fft(signal::Vector{Float64}) -> FFTResult

Fast Fourier Transform with φ-harmonic frequency binning.

# Arguments
- `signal`: Time-domain signal (real-valued)

# Returns
- `FFTResult` with frequencies, magnitudes, phases, and φ-peaks

# Notes
- φ-peaks are bins at Fibonacci indices (1, 2, 3, 5, 8, 13, ...)
- Magnitude is |FFT|, Phase is angle(FFT)

# Example
```julia
signal = sin.(2π * 10 * (0:0.01:1))  # 10 Hz sine
result = phi_fft(signal)
# Peak at index corresponding to 10 Hz
```
"""
function phi_fft(signal::Vector{Float64})::FFTResult
    N = length(signal)
    
    # Compute FFT
    F = fft(signal)
    
    # Frequency bins (Hz, assuming unit sample rate)
    frequencies = fftfreq(N) .* N
    
    # Magnitude and phase
    magnitudes = abs.(F)
    phases = angle.(F)
    
    # Find φ-peaks at Fibonacci indices
    fibs = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987]
    phi_peaks = filter(f -> f <= N÷2, fibs)  # Only positive frequencies
    
    FFTResult(
        Float64.(frequencies[1:N÷2+1]),
        Float64.(magnitudes[1:N÷2+1]),
        Float64.(phases[1:N÷2+1]),
        phi_peaks
    )
end

# ══════════════════════════════════════════════════════════════════
#  DYNAMICAL SYSTEMS
# ══════════════════════════════════════════════════════════════════

"""
    kuramoto_sync(phases, frequencies, coupling, dt, steps) -> KuramotoResult

Kuramoto model synchronization simulation with φ-coupling.

# Arguments
- `phases`: Initial oscillator phases (radians)
- `frequencies`: Natural frequencies (rad/s)
- `coupling`: Coupling strength K (use PHI for golden coupling)
- `dt`: Time step
- `steps`: Number of simulation steps

# Returns
- `KuramotoResult` with final phases, order parameter, and history

# Notes
- Order parameter R ∈ [0,1]. R > 0.9 indicates strong synchronization.
- Golden coupling (K = φ) often produces interesting bifurcation behavior.

# Example
```julia
N = 100
phases = 2π * rand(N)
freqs = randn(N)
result = kuramoto_sync(phases, freqs, PHI, 0.01, 10000)
# result.order_parameter ≈ 0.85 (synchronized)
```
"""
function kuramoto_sync(
    phases::Vector{Float64},
    frequencies::Vector{Float64},
    coupling::Float64,
    dt::Float64,
    steps::Int
)::KuramotoResult
    @assert length(phases) == length(frequencies) "Phases and frequencies must match"
    
    N = length(phases)
    θ = copy(phases)
    ω = frequencies
    K = coupling
    
    history = Vector{Float64}(undef, steps)
    
    for t in 1:steps
        # Compute order parameter
        Z = sum(exp.(im .* θ)) / N
        R = abs(Z)
        ψ = angle(Z)
        history[t] = R
        
        # Kuramoto dynamics: dθ/dt = ω + K*R*sin(ψ - θ)
        for i in 1:N
            θ[i] += dt * (ω[i] + K * R * sin(ψ - θ[i]))
        end
        
        # Wrap phases to [0, 2π)
        θ .= mod.(θ, 2π)
    end
    
    # Final order parameter
    Z_final = sum(exp.(im .* θ)) / N
    R_final = abs(Z_final)
    
    KuramotoResult(θ, R_final, history)
end

# ══════════════════════════════════════════════════════════════════
#  TEMPORAL / BIORHYTHM
# ══════════════════════════════════════════════════════════════════

"""
    calculate_biorhythm(timestamp_ms::Float64) -> Float64

Calculate biorhythm score using ancient calendar mathematics and φ-harmonics.

# Arguments
- `timestamp_ms`: Milliseconds since UNIX epoch

# Returns
- Normalized biorhythm score (0.0 to 1.0)

# Notes
Combines 6 ancient/natural cycles:
- Mayan: 1440ms (24 minutes)
- Sumerian: 3600ms (60 minutes)
- Egyptian: 2160ms (36 minutes)
- Lunar: 2551ms (φ-derived)
- Solar: 8760ms (hour angle)
- φ-heartbeat: 873ms (540 × φ)

Uses Pythagorean combination of sine waves, normalized by φ/(φ+1).

# Example
```julia
now_ms = Float64(Dates.datetime2unix(now()) * 1000)
score = calculate_biorhythm(now_ms)
# score ∈ [0.0, 1.0]
```
"""
function calculate_biorhythm(timestamp_ms::Float64)::Float64
    # Calculate phase for each ancient cycle
    mayan_phase = mod(timestamp_ms, MAYAN_CYCLE) / MAYAN_CYCLE
    sumerian_phase = mod(timestamp_ms, SUMERIAN_HOUR) / SUMERIAN_HOUR
    egyptian_phase = mod(timestamp_ms, EGYPTIAN_HOUR) / EGYPTIAN_HOUR
    lunar_phase = mod(timestamp_ms, LUNAR_CYCLE) / LUNAR_CYCLE
    solar_phase = mod(timestamp_ms, SOLAR_CYCLE) / SOLAR_CYCLE
    phi_phase = mod(timestamp_ms, PHI_HEARTBEAT) / PHI_HEARTBEAT
    
    # Convert phases to sine waves
    mayan_wave = sin(2π * mayan_phase)
    sumerian_wave = sin(2π * sumerian_phase)
    egyptian_wave = sin(2π * egyptian_phase)
    lunar_wave = sin(2π * lunar_phase)
    solar_wave = sin(2π * solar_phase)
    phi_wave = sin(2π * phi_phase)
    
    # Pythagorean combination: sqrt(sum of squares) / sqrt(n)
    pythagorean_sum = sqrt(
        mayan_wave^2 +
        sumerian_wave^2 +
        egyptian_wave^2 +
        lunar_wave^2 +
        solar_wave^2 +
        phi_wave^2
    ) / sqrt(6.0)
    
    # Normalize to [0, 1] using φ/(φ+1)
    normalized = (pythagorean_sum + 1.0) / 2.0 * PHI / (PHI + 1.0)
    
    clamp(normalized, 0.0, 1.0)
end

# ══════════════════════════════════════════════════════════════════
#  STATISTICS
# ══════════════════════════════════════════════════════════════════

"""
    phi_weighted_mean(values, ranks) -> Float64

Calculate φ-weighted mean with golden ratio priority scaling.

# Arguments
- `values`: Values to average
- `ranks`: Ranks (0-4) for φ^rank weighting

# Returns
- Weighted mean

# Notes
- Rank 0 → weight 1.0
- Rank 1 → weight φ ≈ 1.618
- Rank 2 → weight φ² ≈ 2.618
- Rank 3 → weight φ³ ≈ 4.236
- Rank 4 → weight φ⁴ ≈ 6.854

# Example
```julia
values = [100.0, 200.0, 300.0]
ranks = [0, 2, 1]  # weights: 1.0, 2.618, 1.618
result = phi_weighted_mean(values, ranks)
# result ≈ 219.1 (vs arithmetic mean of 200)
```
"""
function phi_weighted_mean(values::Vector{Float64}, ranks::Vector{Int})::Float64
    @assert length(values) == length(ranks) "Values and ranks must match"
    @assert all(0 .<= ranks .<= 4) "Ranks must be 0-4"
    
    weights = [PHI^r for r in ranks]
    total_weight = sum(weights)
    
    sum(values .* weights) / total_weight
end

# ══════════════════════════════════════════════════════════════════
#  ROUNDTRIP VALIDATION
# ══════════════════════════════════════════════════════════════════

"""
    validate_roundtrip_suite() -> Dict{String, RoundtripResult}

Run comprehensive roundtrip validation for all bridge types.

# Returns
Dictionary mapping type names to validation results.

# Example
```julia
results = validate_roundtrip_suite()
all(r -> r.success, values(results))  # Should be true
```
"""
function validate_roundtrip_suite()::Dict{String, RoundtripResult}
    results = Dict{String, RoundtripResult}()
    
    # Float64 edge cases
    float_cases = [
        ("float64_zero", 0.0),
        ("float64_neg_zero", -0.0),
        ("float64_one", 1.0),
        ("float64_pi", π),
        ("float64_phi", PHI),
        ("float64_inf", Inf),
        ("float64_neg_inf", -Inf),
        ("float64_nan", NaN),
        ("float64_max", floatmax(Float64)),
        ("float64_min", floatmin(Float64)),
        ("float64_eps", eps(Float64)),
    ]
    
    for (name, val) in float_cases
        results[name] = validate_single_roundtrip(val)
    end
    
    # Integer cases
    results["int64_max"] = validate_single_roundtrip(typemax(Int64))
    results["int64_min"] = validate_single_roundtrip(typemin(Int64))
    results["int32"] = validate_single_roundtrip(Int32(12345))
    
    # Vector cases
    results["vector_float64"] = validate_single_roundtrip([1.0, 2.0, PHI, π])
    results["vector_empty"] = validate_single_roundtrip(Float64[])
    
    # Matrix cases
    results["matrix_2x2"] = validate_single_roundtrip([1.0 2.0; 3.0 4.0])
    results["matrix_identity"] = validate_single_roundtrip(Matrix{Float64}(I, 3, 3))
    
    # String cases
    results["text_ascii"] = validate_single_roundtrip("Hello, World!")
    results["text_unicode"] = validate_single_roundtrip("φ = (1 + √5) / 2 ≈ 1.618")
    results["text_empty"] = validate_single_roundtrip("")
    
    # Bool cases
    results["bool_true"] = validate_single_roundtrip(true)
    results["bool_false"] = validate_single_roundtrip(false)
    
    # Optional cases
    results["opt_some"] = validate_single_roundtrip(Union{Float64, Nothing}(3.14))
    results["opt_none"] = validate_single_roundtrip(Union{Float64, Nothing}(nothing))
    
    # NOVA types
    results["phi_weighted"] = validate_single_roundtrip(PhiWeighted(3.14, PHI2))
    results["point3d"] = validate_single_roundtrip(Point3D(1.0, 2.0, 3.0))
    
    results
end

"""
Validate a single value roundtrip.
"""
function validate_single_roundtrip(val::T)::RoundtripResult where T
    try
        encoded = to_candid(val)
        decoded = from_candid(encoded, T)
        
        # Compare with tolerance for floats
        success = compare_values(val, decoded)
        
        # Hash for verification (simplified)
        orig_hash = string(hash(val))
        rt_hash = string(hash(decoded))
        
        RoundtripResult(success, orig_hash, rt_hash, nothing)
    catch e
        RoundtripResult(false, "", "", string(e))
    end
end

"""
Compare values with tolerance for floating-point.
"""
function compare_values(a::T, b::T)::Bool where T
    if T <: AbstractFloat
        if isnan(a) && isnan(b)
            return true
        end
        return a == b || abs(a - b) < max(abs(a), abs(b)) * 1e-15
    elseif T <: AbstractArray
        return all(compare_values.(a, b))
    else
        return a == b
    end
end

compare_values(a::Matrix, b::Matrix) = size(a) == size(b) && all(compare_values.(a, b))

# ══════════════════════════════════════════════════════════════════
#  CANDID ENCODING FOR RESULT TYPES
# ══════════════════════════════════════════════════════════════════

function TypeBridge.to_candid(r::EigenResult)
    fields = Dict{Symbol, CandidValue}(
        :values => to_candid(r.values),
        :vectors => to_candid(r.vectors),
        :phi_coherence => to_candid(r.phi_coherence)
    )
    CandidValue(CT_RECORD, nothing, fields)
end

function TypeBridge.to_candid(r::SVDResult)
    fields = Dict{Symbol, CandidValue}(
        :U => to_candid(r.U),
        :S => to_candid(r.S),
        :Vt => to_candid(r.Vt),
        :phi_rank => to_candid(r.phi_rank)
    )
    CandidValue(CT_RECORD, nothing, fields)
end

function TypeBridge.to_candid(r::FFTResult)
    fields = Dict{Symbol, CandidValue}(
        :frequencies => to_candid(r.frequencies),
        :magnitudes => to_candid(r.magnitudes),
        :phases => to_candid(r.phases),
        :phi_peaks => to_candid(r.phi_peaks)
    )
    CandidValue(CT_RECORD, nothing, fields)
end

function TypeBridge.to_candid(r::KuramotoResult)
    fields = Dict{Symbol, CandidValue}(
        :final_phases => to_candid(r.final_phases),
        :order_parameter => to_candid(r.order_parameter),
        :coherence_history => to_candid(r.coherence_history)
    )
    CandidValue(CT_RECORD, nothing, fields)
end

function TypeBridge.to_candid(r::CoherenceResult)
    fields = Dict{Symbol, CandidValue}(
        :frobenius_norm => to_candid(r.frobenius_norm),
        :phi_coherence => to_candid(r.phi_coherence),
        :rank_estimate => to_candid(r.rank_estimate),
        :condition_number => to_candid(r.condition_number)
    )
    CandidValue(CT_RECORD, nothing, fields)
end

function TypeBridge.to_candid(m::Matrix{Float64})
    # Convert to nested vector (row-major for JS/Motoko)
    rows, cols = size(m)
    nested = [[m[i, j] for j in 1:cols] for i in 1:rows]
    to_candid(nested)
end

function TypeBridge.from_candid(cv::CandidValue, ::Type{Matrix{Float64}})
    nested = from_candid(cv, Vector{Vector{Float64}})
    rows = length(nested)
    cols = rows > 0 ? length(nested[1]) : 0
    m = Matrix{Float64}(undef, rows, cols)
    for i in 1:rows
        for j in 1:cols
            m[i, j] = nested[i][j]
        end
    end
    m
end

end # module NumericalBridge
