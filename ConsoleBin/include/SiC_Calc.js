include("SiC_GetData.js")

sic_calc_rf_max_zone = 50;

function SiC_CALC_Delay(Curves)
{
	var _Vge = Curves.Vge;
	var _Ice = Curves.Ice;
	var TimeScale = Curves.HScale;
	
	// check input data
	if (_Vge.length != _Ice.length)
		print("Delay calc: arrays of different lengths.")
	
	// get curves pivot points
	var Vge_pivot = SiC_CALC_SignalRiseFall(_Vge, TimeScale);
	var Ice_pivot = SiC_CALC_SignalRiseFall(_Ice, TimeScale);
	
	var delay = SiC_CALC_OnMode(Curves) ? (Ice_pivot.t_min - Vge_pivot.t_min) : (Ice_pivot.t_max - Vge_pivot.t_max);
	
	return (delay * TimeScale / 250 * 1e9);
}

function SiC_CALC_VI_RiseFall(Curves)
{
	var V_points = SiC_CALC_SignalRiseFall(Curves.Vce, Curves.HScale);
	var I_points = SiC_CALC_SignalRiseFall(Curves.Ice, Curves.HScale);
	
	return {V_points : V_points, I_points : I_points};
}

function SiC_CALC_SignalRiseFall(Signal, TimeScale, LowPoint)
{
	// find plate max value
	var S_amp = 0;
	var rise_mode = (Signal[0] < Signal[Signal.length - 1]) ? 1 : 0;
	
	// find amplitude
	for (var i = 0; i < sic_calc_rf_max_zone; ++i)
		S_amp += Signal[rise_mode ? (Signal.length - 1 - i) : i];
	S_amp /= sic_calc_rf_max_zone;
	
	// find rise/fall zone
	var t_min = 0;
	var t_max = 0;
	
	if (typeof LowPoint === 'undefined')
		LowPoint = 0.1;
	
	for (var i = 0; i < Signal.length; ++i)
	{
		if (Signal[rise_mode ? i : (Signal.length - 1 - i)] > (S_amp * LowPoint) && t_min == 0)
			t_min = (rise_mode ? i : (Signal.length - 1 - i));
		
		if (Signal[rise_mode ? i : (Signal.length - 1 - i)] > (S_amp * 0.9) && t_max == 0)
			t_max = (rise_mode ? i : (Signal.length - 1 - i));
	}
	
	// calculate rise/fall
	var t_rf = Math.abs((t_max - t_min) * (TimeScale / 250));
	t_rf = t_rf * 1e9;
	var S_rf = Math.abs((Signal[t_max] - Signal[t_min]) / t_rf);
	S_rf = S_rf * 1e3;
	var S_max = SiC_GD_MAX(Signal).Value;
	
	return {S_max : S_max, S_amp : S_amp, S_rf : S_rf, t_rf : t_rf, t_min : t_min, t_max : t_max};
}

function SiC_CALC_Recovery(Curves)
{
	var Current = Curves.Ice;
	var TimeScale = Curves.HScale;
	
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
	var current_trim = [];
	for (var i = tr0; i < Current.length; ++i)
		current_trim[i - tr0] = Current[i] - (i * LineI.k + LineI.b);
	
	// find Irrm
	var Irrm_Point = SiC_GD_MAX(current_trim);
	var Irrm = Irrm_Point.Value;
	
	// find aux curve points
	var AuxPoint1 = {X : null, Y : null};
	var AuxPoint2 = {X : null, Y : null};
	
	for (var i = Irrm_Point.Index; i < current_trim.length; ++i)
	{
		if (current_trim[i] <= Irrm * 0.9)
		{
			AuxPoint1.Y = current_trim[i];
			AuxPoint1.X = i;
			break;
		}
	}
	
	for (var i = Irrm_Point.Index; i < current_trim.length; ++i)
	{
		if (current_trim[i] <= Irrm * 0.25)
		{
			AuxPoint2.Y = current_trim[i];
			AuxPoint2.X = i;
			break;
		}
	}
	
	var k_r = (AuxPoint1.Y - AuxPoint2.Y) / (AuxPoint1.X - AuxPoint2.X);
	var b_r = AuxPoint1.Y - k_r * AuxPoint1.X;
	
	// find trr
	var trr_index = Math.round(-b_r / k_r);
	var trr = -b_r / k_r * TimeScale / 250 * 1e9;
	var Qrr = SiC_CALC_Integrate(current_trim, TimeScale / 250 * 1e6, 0, trr_index - 1)
	
	return {trr : trr, Irrm : Irrm, Qrr : Qrr};
}

function SiC_CALC_RecoveryGetXY(Data)
{
	var MaxPoint = SiC_GD_MAX(Data);
	
	var StartIndex = MaxPoint.Index + Math.round((Data.length - MaxPoint.Index) * 0.25);
	var EndIndex = Data.length - 1;
	
	var Iavg = SiC_GD_AvgData(Data, StartIndex, EndIndex);
	
	return {k : 0, b : Iavg}
}

function SiC_CALC_Energy(Curves)
{
	var _Vge = Curves.Vge;
	var _Vce = Curves.Vce;
	var _Ice = Curves.Ice;
	var TimeScale = Curves.HScale;
	
	// check input data
	if (_Vce.length != _Ice.length)
		print("Energy calc: arrays of different lengths.")
	
	// determine calculation mode
	var on_mode = SiC_CALC_OnMode(Curves) ? 1 : 0;
	
	// get curves pivot points
	var Vge_pivot = SiC_CALC_SignalRiseFall(_Vge, TimeScale);
	var Vce_pivot = SiC_CALC_SignalRiseFall(_Vce, TimeScale, 0.02);
	var Ice_pivot = SiC_CALC_SignalRiseFall(_Ice, TimeScale, 0.02);
	
	// determine time limits
	var start_time = on_mode ? Vge_pivot.t_min : Vge_pivot.t_max;
	var stop_time  = on_mode ? Vce_pivot.t_min : Ice_pivot.t_min;
	
	// calculate power
	var Power = [];
	for (var i = start_time; i < stop_time; ++i)
		Power[i - start_time] = _Vce[i] * _Ice[i];
	
	var Energy = SiC_CALC_Integrate(Power, TimeScale / 250 * 1e3, 0, Power.length - 1);
	
	return {Power : Power, Energy : Energy};
}

function SiC_CALC_OnMode(Curves)
{
	return (Curves.Vce[0] > Curves.Vce[Curves.Vce.length - 1]);
}

function SiC_CALC_Integrate(Data, TimeScale, StartIndex, EndIndex)
{
	var Result = 0;
	
	for (var i = StartIndex; i <= EndIndex; ++i)
		Result += Data[i];
	Result -= 0.5 * (Data[StartIndex] + Data[EndIndex]);
	
	return Result * TimeScale;
}
