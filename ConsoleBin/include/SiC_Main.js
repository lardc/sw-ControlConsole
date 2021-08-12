include("SiC_Calc.js")

sic_diag_plot = true;

function SiC_Plot(Data)
{
	plot3(Data.Vge, Data.Vce, Data.Ice, 1, 0);
}

function SiC_PrintRF(Data)
{
	print("S_max:\t"  + Data.S_max.toFixed(1));
	print("S_amp:\t"  + Data.S_amp.toFixed(1));
	print("S_rf:\t"   + Data.S_rf.toFixed(0));
	print("t_rf:\t"   + Data.t_rf.toFixed(1));
	print("t_min:\t"  + Data.t_min);
	print("t_max:\t"  + Data.t_max);
}

function SiC_Main(Curves)
{
	var Mode = SiC_CALC_OnMode(Curves);
	var RiseFallData = SiC_CALC_VI_RiseFall(Curves);
	
	print("V" + ":\t\t" + RiseFallData.V_points.S_amp.toFixed(0) + "\t (V)");
	print("Vmax" + ":\t\t" + RiseFallData.V_points.S_max.toFixed(0) + "\t (V)");
	print("---");
	print("I" + ":\t\t" + RiseFallData.I_points.S_amp.toFixed(0) + "\t (A)");
	print("Imax" + ":\t\t" + RiseFallData.I_points.S_max.toFixed(0) + "\t (A)");
	print("---");
	print("dI/dt_" + (Mode ? "on" : "off") + ":\t" + RiseFallData.I_points.S_rf.toFixed(0) + "\t (A/us)");
	print("t" + (Mode ? "r" : "f") + "i:\t\t" + RiseFallData.I_points.t_rf.toFixed(0) + "\t (ns)");
	print("tdi_" + (Mode ? "on: " : "off:") + "\t" + SiC_CALC_Delay(Curves).toFixed(0) + "\t (ns)");
	print("---");
	print("dU/dt_" + (Mode ? "on" : "off") + ":\t" + RiseFallData.V_points.S_rf.toFixed(0) + "\t (V/us)");
	print("t" + (Mode ? "f" : "r") + "v:\t\t" + RiseFallData.V_points.t_rf.toFixed(0) + "\t (ns)");
	print("E_" + (Mode ? "on" : "off") + ":\t\t" + SiC_CALC_Energy(Curves).Energy.toFixed(0) + "\t (mJ)");
	
	if (Mode)
	{
		var Recovery = SiC_CALC_Recovery(Curves);
		
		print("---");
		print("Irrm" + ":\t\t" + Recovery.Irrm.toFixed(0) + "\t (A)");
		print("trr" + ":\t\t" + Recovery.trr.toFixed(0) + "\t (ns)");
		print("Qrr" + ":\t\t" + Recovery.Qrr.toFixed(0) + "\t (uC)");
		print("E_rec" + ":\t\t" + Recovery.Energy.toFixed(1) + "\t (mJ)");
	}
}

function SiC_Start()
{
	dev.c(101);
	sleep(200);
	SiC_Main(SiC_GD_GetCurves(3, 2, 1));
}
