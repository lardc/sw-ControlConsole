include("TestGTU_4.0.js")
include("Tektronix.js")
include("CalGeneral.js")

// Global definitions
cgtu_ResGate  = 10;	// in Ohms
cgtu_ResPower = 10;	// in Ohms
cgtu_CurrentValues = [];
//
cgtu_UseAvg = 1;
cgtu_UseRangeTuning = 1;
cgtu_PlotSummaryError = 0;

// Current limits
cgtu_Imax = 1000;
cgtu_Imin = 50;
cgtu_Istp = 95;

cgtu_Vdmax = 12000;
cgtu_Vdmin = 2000;
cgtu_Vdstp = 1000;

cgtu_Vgmax = 12000;
cgtu_Vgmin = 100;
cgtu_Vgstp = 1190;

// Counters
cgtu_cntTotal = 0;
cgtu_cntDone = 0;

// Results storage
cgtu_vd = [];
cgtu_vgt = [];
cgtu_igt = [];
cgtu_id = [];
cgtu_vd_set = [];
cgtu_vgt_set = [];
cgtu_igt_set = [];
cgtu_id_set = [];


// Tektronix data
cgtu_vd_sc = [];
cgtu_vgt_sc = [];
cgtu_igt_sc = [];
cgtu_id_sc = [];


// Relative error
cgtu_vgt_err = [];
cgtu_vd_err = [];
cgtu_igt_err = [];
cgtu_id_err = [];
cgtu_vgt_set_err = [];
cgtu_vd_set_err = [];
cgtu_igt_set_err = [];
cgtu_id_set_err = [];


// Summary error
cgtu_vgt_err_sum = [];
cgtu_vd_err_sum = [];
cgtu_igt_err_sum = [];
cgtu_id_err_sum = [];
cgtu_vgt_set_err_sum = [];
cgtu_vd_set_err_sum = [];
cgtu_igt_set_err_sum = [];
cgtu_id_set_err_sum = [];


// Correction
cgtu_vd_corr = [];
cgtu_vgt_corr = [];
cgtu_igt_corr = [];
cgtu_id_corr = [];
cgtu_vd_set_corr = [];
cgtu_vgt_set_corr = [];
cgtu_igt_set_corr = [];
cgtu_id_set_corr = [];

cgtu_chMeasureGate = 1;
cgtu_chMeasurePower = 2;

// Iterations
cgtu_Iterations = 3;

// Measurement errors
EUosc = 3;
ER = 0.5;
E0 = 0;

// Variables
var AlowedError = 0;
var R1 = 0;
var R2 = 0;
var R3 = 0;
var R4 = 0;


function CGTU_Init(portGate, portTek, channelMeasureGate, channelMeasurePower)
{
	if (channelMeasureGate < 1 || channelMeasureGate > 4 ||
		channelMeasurePower < 1 || channelMeasurePower > 4)
	{
		print("Wrong channel numbers");
		return;
	}
	
	// Copy channel information
	cgtu_chMeasureGate = channelMeasureGate;
	cgtu_chMeasurePower = channelMeasurePower;
	
	// Init GTU
	dev.Disconnect();
	dev.Connect(portGate);
	
	// Init Tektronix
	TEK_PortInit(portTek);
	
	// Tektronix init
	// Init channels
	TEK_ChannelInit(cgtu_chMeasureGate, "1", "1");
	TEK_ChannelInit(cgtu_chMeasurePower, "1", "1");
	// Init trigger
	TEK_TriggerPulseInit(cgtu_chMeasureGate, "1");
	CGTU_TriggerTune();
	// Horizontal settings
	TEK_Horizontal("10e-3", "-40e-3");
	
	// Display channels
	for (var i = 1; i <= 4; i++)
	{
		if (i == cgtu_chMeasureGate || i == cgtu_chMeasurePower)
			TEK_ChannelOn(i);
		else
			TEK_ChannelOff(i);
	}
	
	// Init measurement
	CGTU_TekCursor(cgtu_chMeasureGate);
	CGTU_TekCursor(cgtu_chMeasurePower);
}

function CGTU_CalibrateIGate()
{
	// Collect data
	CGTU_SetLimits();
	CGTU_ResetA();
	CGTU_ResetIGateCal();
	
	if (CGTU_CollectIGate(cgtu_Iterations))
	{
		CGTU_SaveIGate("gtu_igt", "gtu_igt_set");
		
		// Plot relative error distribution
		//scattern(cgtu_igt_sc, cgtu_igt_err, "Igt (in mA)", "Error (in %)", "Igt relative error");
		//scattern(cgtu_igt_sc, cgtu_igt_set_err, "Igt (in mA)", "Error (in %)", "Igt set relative error");
		
		// Calculate correction			
		cgtu_igt_corr = CGEN_GetCorrection2("gtu_igt");
		CGTU_CalIGT(cgtu_igt_corr[0], cgtu_igt_corr[1], cgtu_igt_corr[2]);
		
		cgtu_igt_set_corr = CGEN_GetCorrection2("gtu_igt_set");
		CGTU_CalIGT_SET(cgtu_igt_set_corr[0], cgtu_igt_set_corr[1], cgtu_igt_set_corr[2]);
		
		// Print correction
		CGTU_PrintIGateCal();
		CGTU_PrintIGateSetCal();
		
		// Restore alowed error
		dev.w(3,AlowedError);
	}
}

function CGTU_CalibrateIPower()
{
	// Collect data
	CGTU_SetLimits();
	CGTU_ResetA();
	CGTU_ResetIPowerCal();
	
	if (CGTU_CollectIPower(cgtu_Iterations))
	{
		CGTU_SaveIPower("gtu_id", "gtu_id_set");
		
		// Plot relative error distribution
		//scattern(cgtu_id_sc, cgtu_id_err, "Id (in mA)", "Error (in %)", "Id relative error");
		//scattern(cgtu_id_sc, cgtu_id_set_err, "Id set (in mA)", "Error (in %)", "Id set relative error");
		
		// Calculate correction
		cgtu_id_corr = CGEN_GetCorrection2("gtu_id");
		CGTU_CalID(cgtu_id_corr[0], cgtu_id_corr[1], cgtu_id_corr[2]);
		
		cgtu_id_set_corr = CGEN_GetCorrection2("gtu_id_set");
		CGTU_CalID_SET(cgtu_id_set_corr[0], cgtu_id_set_corr[1], cgtu_id_set_corr[2]);
		
		// Print correction
		CGTU_PrintIPowerCal();
		CGTU_PrintIPowerSetCal();
		
		// Restore alowed error
		dev.w(3,AlowedError);
	}
}

function CGTU_CalibrateVGate()
{
	// Collect data
	CGTU_SetLimits();
	CGTU_ResetA();
	CGTU_ResetVGateCal();
	
	if (CGTU_CollectVGate(cgtu_Iterations))
	{
		CGTU_SaveVGate("gtu_vgt");
		
		// Plot relative error distribution
		//scattern(cgtu_vgt_sc, cgtu_vgt_err, "Vgt (in mV)", "Error (in %)", "Vgt relative error");
		//scattern(cgtu_vgt_sc, cgtu_vgt_set_err, "Vgt (in mV)", "Error (in %)", "Vgt set relative error");
		
		// Calculate correction			
		cgtu_vgt_corr = CGEN_GetCorrection2("gtu_vgt");
		CGTU_CalVGT(cgtu_vgt_corr[0], cgtu_vgt_corr[1], cgtu_vgt_corr[2]);
		
		// Print correction
		CGTU_PrintVGateCal();
		
		// Restore alowed error
		dev.w(3,AlowedError);
	}
}



function CGTU_CalibrateVPower()
{
	// Collect data
	CGTU_SetLimits();
	CGTU_ResetA();
	CGTU_ResetVPowerCal();
	
	if (CGTU_CollectVPower(cgtu_Iterations))
	{
		CGTU_SaveVPower("gtu_vd");
		
		// Plot relative error distribution
		//scattern(cgtu_vd_sc, cgtu_vd_err, "Vd (in mV)", "Error (in %)", "Vd relative error");
		//scattern(cgtu_vd_sc, cgtu_vd_set_err, "Vd (in mV)", "Error (in %)", "Vd set relative error");
		
		// Calculate correction		
		cgtu_vd_corr = CGEN_GetCorrection2("gtu_vd");
		CGTU_CalVD(cgtu_vd_corr[0], cgtu_vd_corr[1], cgtu_vd_corr[2]);
		
		// Print correction
		CGTU_PrintVPowerCal();
		
		// Restore alowed error
		dev.w(3,AlowedError);
	}
}

function CGTU_VerifyVGate()
{
	// Collect corrected data
	CGTU_ResetA();
	if (CGTU_CollectVGate(cgtu_Iterations))
	{
		CGTU_SaveVGate("gtu_vgt_fixed");
		
		// Plot relative error distribution
		scattern(cgtu_vgt_sc, cgtu_vgt_err, "Vgt (in mV)", "Error (in %)", "Vgt relative error"); sleep(200);
		//scattern(cgtu_vgt_sc, cgtu_vgt_set_err, "Vgt (in mV)", "Error (in %)", "Vgt set relative error"); sleep(200);
		
		// Plot summary error distribution
		if(cgtu_PlotSummaryError)
		{
			scattern(cgtu_vgt_sc, cgtu_vgt_err_sum, "Vgt (in mV)", "Error (in %)", "Vgt summary error");sleep(200);
			scattern(cgtu_vgt_sc, cgtu_vgt_set_err_sum, "Vgt (in mV)", "Error (in %)", "Vgt set summary error");
		}
	}
}

function CGTU_VerifyIGate()
{
	// Collect corrected data
	CGTU_ResetA();
	if (CGTU_CollectIGate(cgtu_Iterations))
	{
		CGTU_SaveIGate("gtu_igt_fixed", "gtu_igt_set_fixed");
		
		// Plot relative error distribution
		scattern(cgtu_igt_sc, cgtu_igt_err, "Igt (in mA)", "Error (in %)", "Igt relative error"); sleep(200);
		//scattern(cgtu_igt_sc, cgtu_igt_set_err, "Igt set (in mA)", "Error (in %)", "Igt set relative error");
		
		// Plot summary error distribution
		if(cgtu_PlotSummaryError)
		{
			scattern(cgtu_igt_sc, cgtu_igt_err_sum, "Igt (in mA)", "Error (in %)", "Igt summary error");sleep(200);
			scattern(cgtu_igt_sc, cgtu_igt_set_err_sum, "Igt set (in mA)", "Error (in %)", "Igt set summary error");
		}
	}
}

function CGTU_VerifyVPower()
{
	// Collect corrected data
	CGTU_ResetA();
	if (CGTU_CollectVPower(cgtu_Iterations))
	{
		CGTU_SaveVPower("gtu_vd_fixed");
		
		// Plot relative error distribution
		scattern(cgtu_vd_sc, cgtu_vd_err, "Vd (in mV)", "Error (in %)", "Vd relative error");
		//scattern(cgtu_vd_sc, cgtu_vd_set_err, "Vd (in mV)", "Error (in %)", "Vd set relative error");
		
		// Plot summary error distribution
		if(cgtu_PlotSummaryError)
		{
			scattern(cgtu_vd_sc, cgtu_vd_err_sum, "Vd (in mV)", "Error (in %)", "Vd summary error");
			scattern(cgtu_vd_sc, cgtu_vd_set_err_sum, "Vd (in mV)", "Error (in %)", "Vd set summary error");
		}
	}
}

function CGTU_VerifyIPower()
{
	// Collect corrected data
	CGTU_ResetA();
	if (CGTU_CollectIPower(cgtu_Iterations))
	{
		CGTU_SaveIPower("gtu_id_fixed", "gtu_id_set_fixed");
		
		// Plot relative error distribution
		scattern(cgtu_id_sc, cgtu_id_err, "Id (in mA)", "Error (in %)", "Id relative error");
		//scattern(cgtu_id_sc, cgtu_id_set_err, "Id set (in mA)", "Error (in %)", "Id set relative error");
		
		// Plot summary error distribution
		if(cgtu_PlotSummaryError)
		{
			scattern(cgtu_id_sc, cgtu_id_err_sum, "Id (in mA)", "Error (in %)", "Id summary error");
			scattern(cgtu_id_sc, cgtu_id_set_err_sum, "Id set (in mA)", "Error (in %)", "Id set summary error");
		}
	}
}

function CGTU_CollectVGate(IterationsCount)
{
	cgtu_CurrentValues = CGEN_GetRange(cgtu_Vgmin, cgtu_Vgmax, cgtu_Vgstp);

	print("Gate resistance set to " + cgtu_ResGate + " Ohms");
	print("-----------");
	return CGTU_Collect(110, cgtu_ResGate, cgtu_CurrentValues, IterationsCount);
}

function CGTU_CollectIGate(IterationsCount)
{
	cgtu_CurrentValues = CGEN_GetRange(cgtu_Imin, cgtu_Imax, cgtu_Istp);

	print("Gate resistance set to " + cgtu_ResGate + " Ohms");
	print("-----------");
	return CGTU_Collect(111, cgtu_ResGate, cgtu_CurrentValues, IterationsCount);
}

function CGTU_CollectVPower(IterationsCount)
{
	cgtu_CurrentValues = CGEN_GetRange(cgtu_Vdmin, cgtu_Vdmax, cgtu_Vdstp);

	print("Power resistance set to " + cgtu_ResPower + " Ohms");
	print("-----------");
	return CGTU_Collect(112, cgtu_ResPower, cgtu_CurrentValues, IterationsCount);
}

function CGTU_CollectIPower(IterationsCount)
{
	cgtu_CurrentValues = CGEN_GetRange(cgtu_Imin, cgtu_Imax, cgtu_Istp);

	print("Power resistance set to " + cgtu_ResPower + " Ohms");
	print("-----------");
	return CGTU_Collect(113, cgtu_ResPower, cgtu_CurrentValues, IterationsCount);
}

function CGTU_Collect(ProbeCMD, Resistance, cgtu_Values, IterationsCount)
{	
	cgtu_cntTotal = IterationsCount * cgtu_Values.length;
	cgtu_cntDone = 0;
	
	// Init trigger
	TEK_TriggerPulseInit(((ProbeCMD == 110) || (ProbeCMD == 111)) ? cgtu_chMeasureGate : cgtu_chMeasurePower, "1");
	CGTU_TriggerTune();
	
	// Configure scale
	switch(ProbeCMD)
	{
		case 110:
			CGTU_TekScale(cgtu_chMeasureGate, cgtu_Vgmax / 1000);
			break;
			
		case 111:
			CGTU_TekScale(cgtu_chMeasureGate, cgtu_Imax * Resistance / 1000);
			break;
			
		case 112:
			CGTU_TekScale(cgtu_chMeasurePower, cgtu_Vdmax / 1000);
			break;
			
		case 113:
			CGTU_TekScale(cgtu_chMeasurePower, cgtu_Imax * Resistance / 1000);
			break;
	}
	
	sleep(500);
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < cgtu_Values.length; j++)
		{
			if (cgtu_UseRangeTuning)
			{
				switch(ProbeCMD)
				{
					case 110:	// VG
						CGTU_TekScale(cgtu_chMeasureGate, cgtu_Values[j] / 1000);
						TEK_TriggerLevelF(cgtu_Values[j] / (1000 * 2));
						sleep(1000);
						
						// Configure GTU
						dev.w(130, cgtu_Values[j]);
						CGTU_Probe(ProbeCMD);
						break;
						
					case 111:	// IG
						CGTU_TekScale(cgtu_chMeasureGate, cgtu_Values[j] * Resistance / 1000);
						TEK_TriggerLevelF(cgtu_Values[j] * Resistance / (1000 * 2));
						
						sleep(1000);
						
						// Configure GTU
						dev.w(131, cgtu_Values[j]);
						CGTU_Probe(ProbeCMD);
						break;
						
					case 112:	// VD
						CGTU_TekScale(cgtu_chMeasurePower, cgtu_Values[j] / 1000);
						TEK_TriggerLevelF(cgtu_Values[j] / (1000 * 2));
						sleep(1000);
						
						// Configure GTU
						dev.w(128, cgtu_Values[j]);
						CGTU_Probe(ProbeCMD);
						break;
						
					case 113:	// ID
						CGTU_TekScale(cgtu_chMeasurePower, cgtu_Values[j] * Resistance / 1000);
						TEK_TriggerLevelF(cgtu_Values[j] * Resistance / (1000 * 2));
						sleep(1000);
						
						// Configure GTU
						dev.w(129, cgtu_Values[j]);
						CGTU_Probe(ProbeCMD);
						break;
				}
			}
			
			if (anykey()) return 0;
		}
	}
	
	return 1;
}

function CGTU_Probe(ProbeCMD)
{
	var f;
	
	// Acquire mode
	var AvgNum;
	if (cgtu_UseAvg)
	{
		AvgNum = 4;
		TEK_AcquireAvg(AvgNum);
	}
	else
	{
		AvgNum = 1;
		TEK_AcquireSample();
	}
	sleep(500);
	
	for (var i = 0; i < (cgtu_UseAvg ? (AvgNum + 1) : 1); i++)
	{
		dev.c(ProbeCMD);
		while (dev.r(192) != 0) sleep(50);
		sleep(500);
	}
	
	sleep(1000);
	
	if (ProbeCMD == 110)
	{
		f = CGTU_Measure(cgtu_chMeasureGate);
		var vgt = dev.r(204);
		var vgt_sc = f;
		var vgt_set = dev.r(130);
		
		// gtu data
		cgtu_vgt.push(vgt);
		// tektronix data
		cgtu_vgt_sc.push(vgt_sc);
		// relative error
		cgtu_vgt_err.push(((vgt - vgt_sc) / vgt_sc * 100).toFixed(2));
		// Set error
		cgtu_vgt_set_err.push(((vgt_set - vgt_sc) / vgt_sc * 100).toFixed(2));
		// Summary error
		E0 = Math.sqrt(Math.pow(EUosc, 2) + Math.pow(ER, 2));
		cgtu_vgt_err_sum.push(1.1 * Math.sqrt(Math.pow((vgt - vgt_sc) / vgt_sc * 100, 2) + Math.pow(E0, 2)));
		cgtu_vgt_set_err_sum.push(1.1 * Math.sqrt(Math.pow((vgt_set - vgt_sc) / vgt_sc * 100, 2) + Math.pow(E0, 2)));
		
		print("Vset, mV: " + vgt_set);
		print("Vgt,  mV: " + vgt);
		print("Tek,  mV: " + vgt_sc);
	}
	
	if (ProbeCMD == 111)
	{
		f = CGTU_Measure(cgtu_chMeasureGate);
		var igt = dev.r(204);
		var igt_sc = (f / cgtu_ResGate).toFixed(1);
		var igt_set = dev.r(131);
		
		// gtu data
		cgtu_igt.push(igt);
		cgtu_igt_set.push(igt_set);
		// tektronix data
		cgtu_igt_sc.push(igt_sc);
		// relative error
		cgtu_igt_err.push(((igt - igt_sc) / igt_sc * 100).toFixed(2));
		// Set error
		cgtu_igt_set_err.push(((igt_set - igt_sc) / igt_sc * 100).toFixed(2));
		// Summary error
		E0 = Math.sqrt(Math.pow(EUosc, 2) + Math.pow(ER, 2));
		cgtu_igt_err_sum.push(1.1 * Math.sqrt(Math.pow((igt - igt_sc) / igt_sc * 100, 2) + Math.pow(E0, 2)));
		cgtu_igt_set_err_sum.push(1.1 * Math.sqrt(Math.pow((igt_set - igt_sc) / igt_sc * 100, 2) + Math.pow(E0, 2)));
		
		print("Iset, mA: " + igt_set);
		print("Igt,  mA: " + igt);
		print("Tek,  mA: " + igt_sc);
	}
	
	if (ProbeCMD == 112)
	{
		f = CGTU_Measure(cgtu_chMeasurePower);
		var vd = dev.r(204);
		var vd_sc = f;
		var vd_set = dev.r(128);
		
		// gtu data
		cgtu_vd.push(vd);
		// tektronix data
		cgtu_vd_sc.push(vd_sc);
		// relative error
		cgtu_vd_err.push(((vd - vd_sc) / vd_sc * 100).toFixed(2));
		// Set error
		cgtu_vd_set_err.push(((vd_set - vd_sc) / vd_sc * 100).toFixed(2));
		// Summary error
		E0 = Math.sqrt(Math.pow(EUosc, 2) + Math.pow(ER, 2));
		cgtu_vd_err_sum.push(1.1 * Math.sqrt(Math.pow((vd - vd_sc) / vd_sc * 100, 2) + Math.pow(E0, 2)));
		cgtu_vd_set_err_sum.push(1.1 * Math.sqrt(Math.pow((vd_set - vd_sc) / vd_sc * 100, 2) + Math.pow(E0, 2)));
		
		print("Vset, mV: " + vd_set);
		print("Vd,   mV: " + vd);
		print("Tek,  mV: " + vd_sc);
	}
	
	if (ProbeCMD == 113)
	{
		f = CGTU_Measure(cgtu_chMeasurePower);
		var id = dev.r(204);
		var id_sc = (f / cgtu_ResPower).toFixed(1);
		var id_set = dev.r(129);
		
		// gtu data
		cgtu_id.push(id);
		cgtu_id_set.push(id_set);
		// tektronix data
		cgtu_id_sc.push(id_sc);
		// relative error
		cgtu_id_err.push(((id - id_sc) / id_sc * 100).toFixed(2));
		// Set error
		cgtu_id_set_err.push(((id_set - id_sc) / id_sc * 100).toFixed(2));
		// Summary error
		E0 = Math.sqrt(Math.pow(EUosc, 2) + Math.pow(ER, 2));
		cgtu_id_err_sum.push(1.1 * Math.sqrt(Math.pow((id - id_sc) / id_sc * 100, 2) + Math.pow(E0, 2)));
		cgtu_id_set_err_sum.push(1.1 * Math.sqrt(Math.pow((id_set - id_sc) / id_sc * 100, 2) + Math.pow(E0, 2)));
		
		print("Iset, mA: " + id_set);
		print("Id,   mA: " + id);
		print("Tek,  mA: " + id_sc);
	}
	
	cgtu_cntDone++;
	print("-- result " + cgtu_cntDone + " of " + cgtu_cntTotal + " --");
	
	sleep(500);
}

function CGTU_PrintVGateCal()
{
	print("VGT P2 x1e6:	" + dev.rs(28));
	print("VGT P1 x1000:	" + dev.r(29));
	print("VGT P0:		" + dev.rs(30));
}

function CGTU_PrintIGateCal()
{
	print("IGT P2 x1e6:	" + dev.rs(33));
	print("IGT P1 x1000:	" + dev.r(34));
	print("IGT P0:		" + dev.rs(35));
}

function CGTU_PrintIGateSetCal()
{
	print("IGT set P2 x1e6:	" + dev.rs(47));
	print("IGT set P1 x1000:	" + dev.r(48));
	print("IGT set P0:		" + dev.rs(49));
}

function CGTU_PrintVPowerCal()
{
	print("VD  P2 x1e6:	" + dev.rs(18));
	print("VD  P1 x1000:	" + dev.r(19));
	print("VD  P0:		" + dev.rs(20));
}

function CGTU_PrintIPowerCal()
{
	print("ID  P2 x1e6:	" + dev.rs(23));
	print("ID  P1 x1000:	" + dev.r(24));
	print("ID  P0:		" + dev.rs(25));
}

function CGTU_PrintIPowerSetCal()
{
	print("ID set  P2 x1e6:	" + dev.rs(40));
	print("ID set  P1 x1000:	" + dev.r(41));
	print("ID set  P0:		" + dev.rs(42));
}

function CGTU_SetLimits()
{
	// Set alowed error to 30%
	dev.w(3, 30);
	
	// Set limits
	dev.w(128, cgtu_Vdmax);
	dev.w(129, cgtu_Imax);
	dev.w(130, cgtu_Vgmax);
	dev.w(131, cgtu_Imax);
}

function CGTU_ResetVGateCal()
{
	CGTU_CalVGT(0, 1, 0);
	
	AlowedError = dev.r(3);
	dev.w(3,30);
}

function CGTU_ResetIGateCal()
{
	CGTU_CalIGT(0, 1, 0);
	CGTU_CalIGT_SET(0, 1, 0);
	
	AlowedError = dev.r(3);
	dev.w(3,30);
}

function CGTU_ResetVPowerCal()
{
	CGTU_CalVD(0, 1, 0);
	
	AlowedError = dev.r(3);
	dev.w(3,30);
}

function CGTU_ResetIPowerCal()
{
	CGTU_CalID(0, 1, 0);
	CGTU_CalID_SET(0, 1, 0);
	
	AlowedError = dev.r(3);
	dev.w(3,30);
}

function CGTU_CalVGT(P2, P1, P0)
{
	dev.ws(28, Math.round(P2 * 1e6));
	dev.w(29, Math.round(P1 * 1000));
	dev.ws(30, Math.round(P0));
}

function CGTU_CalIGT(P2, P1, P0)
{
	dev.ws(33, Math.round(P2 * 1e6));
	dev.w(34, Math.round(P1 * 1000));
	dev.ws(35, Math.round(P0));
}

function CGTU_CalIGT_SET(P2, P1, P0)
{
	dev.ws(47, Math.round(P2 * 1e6));
	dev.w(48, Math.round(P1 * 1000));
	dev.ws(49, Math.round(P0));
}

function CGTU_CalVD(P2, P1, P0)
{
	dev.ws(18, Math.round(P2 * 1e6));
	dev.w(19, Math.round(P1 * 1000));
	dev.ws(20, Math.round(P0));
}

function CGTU_CalID(P2, P1, P0)
{
	dev.ws(23, Math.round(P2 * 1e6));
	dev.w(24, Math.round(P1 * 1000));
	dev.ws(25, Math.round(P0));
}

function CGTU_CalID_SET(P2, P1, P0)
{
	dev.ws(40, Math.round(P2 * 1e6));
	dev.w(41, Math.round(P1 * 1000));
	dev.ws(42, Math.round(P0));
}

function CGTU_ResetA()
{
	// Results storage
	cgtu_igt = [];
	cgtu_vgt = [];
	cgtu_id = [];
	cgtu_vd = [];
	cgtu_igt_set = [];
	cgtu_id_set = [];

	// Tektronix data
	cgtu_igt_sc = [];
	cgtu_vgt_sc = [];
	cgtu_id_sc = [];
	cgtu_vd_sc = [];

	// Relative error
	cgtu_igt_err = [];
	cgtu_vgt_err = [];
	cgtu_id_err = [];
	cgtu_vd_err = [];
	cgtu_id_set_err = [];
	cgtu_igt_set_err = [];
	cgtu_vd_set_err = [];
	cgtu_vgt_set_err = [];
	
	// Summary error
	cgtu_igt_err_sum = [];
	cgtu_vgt_err_sum = [];
	cgtu_id_err_sum = [];
	cgtu_vd_err_sum = [];
	cgtu_id_set_err_sum = [];
	cgtu_igt_set_err_sum = [];
	cgtu_vd_set_err_sum = [];
	cgtu_vgt_set_err_sum = [];

	// Correction
	cgtu_igt_corr = [];
	cgtu_vgt_corr = [];
	cgtu_id_corr = [];
	cgtu_vd_corr = [];
	cgtu_id_set_corr = [];
	cgtu_igt_set_corr = [];
}

function CGTU_SaveVGate(Name)
{
	CGEN_SaveArrays(Name, cgtu_vgt, cgtu_vgt_sc, cgtu_vgt_err, cgtu_vgt_err_sum);
}

function CGTU_SaveIGate(NameIgt, NameIgt_Set)
{
	CGEN_SaveArrays(NameIgt, cgtu_igt, cgtu_igt_sc, cgtu_igt_err, cgtu_igt_err_sum);
	CGEN_SaveArrays(NameIgt_Set, cgtu_igt_sc, cgtu_igt_set, cgtu_igt_set_err, cgtu_igt_set_err_sum);		
}

function CGTU_SaveVPower(Name)
{
	CGEN_SaveArrays(Name, cgtu_vd, cgtu_vd_sc, cgtu_vd_err, cgtu_vd_err_sum);
}

function CGTU_SaveIPower(NameId, NameId_Set)
{
	CGEN_SaveArrays(NameId, cgtu_id, cgtu_id_sc, cgtu_id_err, cgtu_id_err_sum);
	CGEN_SaveArrays(NameId_Set, cgtu_id_sc, cgtu_id_set, cgtu_id_set_err, cgtu_id_set_err_sum);
}

function CGTU_TriggerTune()
{
	TEK_Send("trigger:main:pulse:width:polarity negative");
	TEK_Send("trigger:main:pulse:width:width 50e-3");
}

function CGTU_TekCursor(Channel)
{
	TEK_Send("cursor:select:source ch" + Channel);
	TEK_Send("cursor:function vbars");
	TEK_Send("cursor:vbars:position1 -60e-3");
	TEK_Send("cursor:vbars:position2 0");
}

function CGTU_TekScale(Channel, Value)
{
	TEK_ChannelScale(Channel, Value);
}

function CGTU_Measure(Channel)
{
	TEK_Send("cursor:select:source ch" + Channel);
	sleep(500);
	
	var f = TEK_Exec("cursor:vbars:hpos1?");
	if (Math.abs(f) > 2e+4)
		f = 0;
	return Math.round(f * 1000);
}