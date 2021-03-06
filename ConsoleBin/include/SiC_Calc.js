include("SiC_GetData.js")

sic_calc_rf_max_zone = 50;
sic_calc_recovery_plate_step = 300;

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
	S_min = 0;
	S_max = 0;
	t_min = 0;
	t_max = 0;
	
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
	var Point1, Point2;
	var stp = sic_calc_recovery_plate_step;
	var Current = Curves.Ice;
	var TimeScale = Curves.HScale;
	
	// line equation to find Ir0 point
	Point1 = SiC_CALC_RecoveryGetXY(Current, Current.length - stp, Current.length);
	Point2 = SiC_CALC_RecoveryGetXY(Current, Current.length - 2 * stp, Current.length - stp);
	
	var k = (Point1.Y - Point2.Y) / (Point1.X - Point2.X);
	var b = Point1.Y - k * Point1.X;
	
	var I_PointMin = SiC_GD_MIN(Current);
	var I_PointMax = SiC_GD_MAX(Current);
	
	// find Ir0
	var Ir0 = 0, tr0 = 0;
	for (var i = I_PointMin.Time; i < I_PointMax.Time; ++i)
	{
		if (Current[i] > (i * k + b))
		{
			Ir0 = Current[i];
			tr0 = i;
			break;
		}
	}
	
	// adjust current data to find reverse recovery charge
	var current_trim = [];
	for (var i = tr0; i < Current.length; ++i)
		current_trim[i - tr0] = Current[i] - (i * k + b);
	
	// find Irrm
	var Irrm_Point = SiC_GD_MAX(current_trim);
	var Irrm   = Irrm_Point.Value;
	
	// find aux curve points
	var trr02 = 0;
	var Irr02 = 0;
	for (var i = Irrm_Point.Time; i < current_trim.length; ++i)
	{
		if (current_trim[i] < Irrm * 0.02)
		{
			Irr02 = current_trim[i];
			trr02 = i;
			break;
		}
	}
	
	var k_r = (Irrm - Irr02) / (Irrm_Point.Time - trr02);
	var b_r = Irrm - k_r * Irrm_Point.Time;
	
	// find trr
	trr_index = Math.round(-b_r / k_r);
	trr = -b_r / k_r * TimeScale / 250 * 1e9;
	
	// find qrr
	var Qrr = 0;
	for (var i = 0; i < trr_index; ++i)
		Qrr += current_trim[i];
	Qrr = (Qrr - (current_trim[0] + current_trim[current_trim.length - 1]) / 2) * TimeScale / 250 * 1e6;
	
	return {trr : trr, Irrm : Irrm, Qrr : Qrr};
}

function SiC_CALC_RecoveryGetXY(Data, RangeStart, RangeStop)
{
	var avg_time = 0;
	var avg_value = 0;
	var avg_counter = 0;
	
	for (var i = RangeStart; i < Data.length && i < RangeStop; ++i)
	{
		avg_time += i;
		avg_value += Data[i];
		++avg_counter;
	}
	
	avg_time  /= avg_counter;
	avg_value /= avg_counter;
	
	return {X:avg_time, Y:avg_value}
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
	
	// integrate
	var Energy = 0;
	var Power = [];
	for (var i = start_time; i < stop_time; ++i)
	{
		var pow = _Vce[i] * _Ice[i];
		Energy += pow;
		Power[i - start_time] = pow;
	}
	Energy = Energy * TimeScale;
	
	return {Power : Power, Energy : Energy};
}

function SiC_CALC_OnMode(Curves)
{
	return (Curves.Vce[0] > Curves.Vce[Curves.Vce.length - 1]);
}
