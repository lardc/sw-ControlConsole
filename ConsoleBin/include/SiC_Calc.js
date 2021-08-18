include("SiC_GetData.js")

sic_calc_rf_max_zone = 50;

sic_calc_rr_magic_A = 20;
sic_calc_rr_magic_B = 12;
sic_calc_rr_magic_C = 2;

function SiC_CALC_Delay(Curves)
{
	var _Vge = Curves.Vge;
	var _Ice = Curves.Ice;
	var TimeStep = Curves.TimeStep;
	
	// check input data
	if (_Vge.length != _Ice.length)
		print("Delay calc: arrays of different lengths.")
	
	// get curves pivot points
	var Vge_pivot = SiC_CALC_SignalRiseFall(_Vge, TimeStep);
	var Ice_pivot = SiC_CALC_SignalRiseFall(_Ice, TimeStep);
	
	var delay = SiC_CALC_OnMode(Curves) ? (Ice_pivot.t_min - Vge_pivot.t_min) : (Ice_pivot.t_max - Vge_pivot.t_max);
	
	return (delay * TimeStep * 1e9);
}

function SiC_CALC_VI_RiseFall(Curves, IsDiode)
{
	var V_points = SiC_CALC_SignalRiseFall(IsDiode ? SiC_GD_InvertData(Curves.Vce) : Curves.Vce, Curves.TimeStep);
	var I_points = SiC_CALC_SignalRiseFall(Curves.Ice, Curves.TimeStep);
	
	return {V_points : V_points, I_points : I_points};
}

function SiC_CALC_SignalRiseFall(Signal, TimeStep, LowPoint)
{
	// find plate max value
	var S_amp = 0;
	var rise_mode = (Signal[0] < Signal[Signal.length - 1]) ? true : false;
	
	// find amplitude
	for (var i = 0; i < sic_calc_rf_max_zone; ++i)
		S_amp += Signal[rise_mode ? (Signal.length - 1 - i) : i];
	S_amp /= sic_calc_rf_max_zone;
	var S_max = SiC_GD_MAX(Signal).Value;
	
	// find rise/fall zone
	var t_min = 0;
	var t_max = 0;
	
	if (typeof LowPoint === 'undefined')
		LowPoint = 0.1;
	
	var BaseValue = rise_mode ? S_amp : S_max;
	for (var i = 0; i < Signal.length; ++i)
	{
		if (Signal[rise_mode ? i : (Signal.length - 1 - i)] >= (BaseValue * LowPoint) && t_min == 0)
			t_min = (rise_mode ? i : (Signal.length - 1 - i));
		
		if (Signal[rise_mode ? i : (Signal.length - 1 - i)] >= (BaseValue * 0.9) && t_max == 0)
			t_max = (rise_mode ? i : (Signal.length - 1 - i));
	}
	
	// calculate rise/fall
	var t_rf = Math.abs((t_max - t_min) * TimeStep);
	t_rf = t_rf * 1e9;
	var S_rf = Math.abs((Signal[t_max] - Signal[t_min]) / t_rf);
	S_rf = S_rf * 1e3;
	
	return {S_max : S_max, S_amp : S_amp, S_rf : S_rf, t_rf : t_rf, t_min : t_min, t_max : t_max};
}

function SiC_CALC_Recovery(Curves, IsDiode)
{
	var Current = IsDiode ? SiC_GD_InvertData(Curves.Ice) : Curves.Ice;
	var Voltage = IsDiode ? SiC_GD_InvertData(Curves.Vce) : Curves.Vce;
	var TimeStep = Curves.TimeStep;
	
	// line equation to find Ir0 point
	var LineI = SiC_CALC_RecoveryGetXY(Current);
	
	var I_PointMin = SiC_GD_MIN(Current);
	var I_PointMax = SiC_GD_MAX(Current);
	
	// find Ir0
	var Ir0 = 0, tr0 = 0;
	for (var i = I_PointMin.Index; i < I_PointMax.Index; ++i)
	{
		if (Current[i] > (i * LineI.k + LineI.b))
		{
			Ir0 = Current[i];
			tr0 = i;
			break;
		}
	}
	
	// adjust current data to find reverse recovery charge
	var CurrentTrim = [];
	var CurrentCut = [];
	for (var i = tr0; i < Current.length; ++i)
	{
		CurrentTrim.push(Current[i] - (i * LineI.k + LineI.b));
		CurrentCut.push(Current[i]);
	}
	plot2(CurrentCut, CurrentTrim, 1, 0);
	
	// find Irrm
	var Irrm_Point = SiC_GD_MAX(CurrentTrim);
	var Irrm = Irrm_Point.Value;
	
	// find aux curve points
	var AuxPoint090 = SiC_CALC_FindAuxPoint(CurrentTrim, Irrm_Point.Index, Irrm * 0.9);
	var AuxPoint025 = SiC_CALC_FindAuxPoint(CurrentTrim, Irrm_Point.Index, Irrm * 0.25);
	var AuxPoint002 = SiC_CALC_FindAuxPoint(CurrentTrim, Irrm_Point.Index, Irrm * 0.02);
	
	var k_r = (AuxPoint090.Y - AuxPoint025.Y) / (AuxPoint090.X - AuxPoint025.X);
	var b_r = AuxPoint090.Y - k_r * AuxPoint090.X;
	
	// find trr
	var trr_index = Math.round(-b_r / k_r);
	var trr = -b_r / k_r * TimeStep * 1e9;
	var Qrr = SiC_CALC_Integrate(CurrentTrim, TimeStep, 0, trr_index - 1) * 1e6;
	
	var trr2 = (trr_index - Irrm_Point.Index) * TimeStep * 1e9;
	var trr1 = trr - trr2;
	
	// calculate recovery energy
	var Power = [];
	var MaxVoltage = SiC_GD_MAX(Voltage).Value;
	for (var i = tr0; i < (tr0 + AuxPoint002.X); ++i)
		Power.push((MaxVoltage - Voltage[i]) * (Current[i] - (i * LineI.k + LineI.b)));
	var Energy = SiC_CALC_Integrate(Power, TimeStep, 0, Power.length - 1) * 1e3;
	
	return {trr : trr, trr1 : trr1, trr2 : trr2, Irrm : Irrm, Qrr : Qrr, Energy : Energy};
}

function SiC_CALC_RecoveryGetXY(Data)
{
	var MaxPoint = SiC_GD_MAX(Data);
	var Fraction = Math.round((Data.length - MaxPoint.Index) / sic_calc_rr_magic_A);
	
	var StartIndex = MaxPoint.Index + Fraction * sic_calc_rr_magic_B;
	var EndIndex = Data.length - Fraction * sic_calc_rr_magic_C;
	
	var k = (Data[StartIndex] - Data[EndIndex]) / (StartIndex - EndIndex);
	var b = Data[StartIndex] - k * StartIndex;
	
	return {k : k, b : b}
}

function SiC_CALC_Energy(Curves)
{
	var _Vge = Curves.Vge;
	var _Vce = Curves.Vce;
	var _Ice = Curves.Ice;
	var TimeStep = Curves.TimeStep;
	
	// check input data
	if (_Vce.length != _Ice.length)
		print("Energy calc: arrays of different lengths.")
	
	// determine calculation mode
	var on_mode = SiC_CALC_OnMode(Curves) ? 1 : 0;
	
	// get curves pivot points
	var Vce_pivot = SiC_CALC_SignalRiseFall(_Vce, TimeStep, 0.02);
	var Ice_pivot = SiC_CALC_SignalRiseFall(_Ice, TimeStep, 0.02);
	
	// determine time limits
	var start_time = 0;
	if (_Vge.length != 0)
	{
		var Vge_pivot = SiC_CALC_SignalRiseFall(_Vge, TimeStep);
		start_time = on_mode ? Vge_pivot.t_min : Vge_pivot.t_max;
	}
	var stop_time  = on_mode ? Vce_pivot.t_min : Ice_pivot.t_min;
	
	// calculate power
	var Power = [];
	for (var i = start_time; i < stop_time; ++i)
		Power[i - start_time] = _Vce[i] * _Ice[i];
	
	var Energy = SiC_CALC_Integrate(Power, TimeStep, 0, Power.length - 1) * 1e3;
	
	return {Power : Power, Energy : Energy};
}

function SiC_CALC_OnMode(Curves)
{
	return (Curves.Vce[0] > Curves.Vce[Curves.Vce.length - 1]);
}

function SiC_CALC_Integrate(Data, TimeStep, StartIndex, EndIndex)
{
	var Result = 0;
	
	for (var i = StartIndex; i <= EndIndex; ++i)
		Result += Data[i];
	Result -= 0.5 * (Data[StartIndex] + Data[EndIndex]);
	
	return Result * TimeStep;
}

function SiC_CALC_FindAuxPoint(Data, StartIndex, Threshold)
{
	var x, y;
	for (var i = StartIndex; i < Data.length; ++i)
	{
		if (Data[i] <= Threshold)
		{
			y = Data[i];
			x = i;
			break;
		}
	}
	
	return {X : x, Y : y};
}

function SiC_CALC_IsDiode(Curves)
{
	return (SiC_GD_AvgData(Curves.Vce, 0, Curves.Vce.length - 1) < 0);
}

function SiC_CALC_IsHighElement(Curves)
{
	return (Curves.Vge.length == 0);
}
