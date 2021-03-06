include("TestBVT.js")
include("Tektronix.js")
include("CalGeneral.js")

// Global definitions
cbvt_VmaxAC = 8000;		// in V
cbvt_VmaxDC	= 4500;		// in V
//
cbvt_Shunt	= 100;		// in Ohms
cbvt_R		= 357000;	// in Ohms
//
cbvt_ShuntP	= 10;		// in Ohms
cbvt_RP		= 30000;	// in Ohms
//
cbvt_RangeV = 2;		// Voltage range number
cbvt_RangeI = 1;		// Current range number
//
cbvt_UseRangeTuning = 1;
//
cbvt_Vmin	= 0;
cbvt_Vmax	= 0;
cbvt_Vstp	= 0;
//
cbvt_MaxP	= 0;
//
cbvt_Ilimit1 = 30;
cbvt_Freq1	 = 50;
//
cbvt_Ilimit2 = 300;
cbvt_Freq2	 = 5;

// DC mode
cbvt_DC_LowI = 0;		// Use low current range (< 100uA) or medium current range (< 5000uA)
//
cbvt_ShuntDC = 51e3;	// in Ohms
cbvt_RDC	 = 100e6;	// in Ohms

// Counters
cbvt_cntTotal = 0;
cbvt_cntDone = 0;

// Results storage
cbvt_v = [];
cbvt_i = [];

// Tektronix data
cbvt_v_sc = [];
cbvt_i_sc = [];

// Relative error
cbvt_v_err = [];
cbvt_i_err = [];

// Summary error
cbvt_v_err_sum = [];
cbvt_i_err_sum = [];

// Correction
cbvt_v_corr = [];
cbvt_i_corr = [];

cbvt_chMeasureV = 1;
cbvt_chMeasureI = 1;

// Iterations
cbvt_Iterations = 3;

// Measurement errors
EUosc = 3;
ER = 1;
E0 = 0;

function CBVT_CalibrateV()
{
	cbvt_MaxP = 0;
	//
	cbvt_Vmin	= 500;
	cbvt_Vmax	= cbvt_VmaxAC;
	cbvt_Vstp	= 500;
	
	CBVT_Prepare();
	CBVT_ResetVCal();
	
	if (CBVT_Collect(cbvt_VoltageValues, cbvt_Iterations, 1))
	{
		CBVT_SaveV("bvt_v");
		
		// Plot relative error distribution
		scattern(cbvt_v_sc, cbvt_v_err, "Voltage (in V)", "Error (in %)", "Voltage relative error");
		
		if (CGEN_UseQuadraticCorrection())
		{
			// Calculate correction
			cbvt_v_corr = CGEN_GetCorrection2("bvt_v");
			CBVT_Correct2V(cbvt_v_corr[0], cbvt_v_corr[1], cbvt_v_corr[2]);	
		}
		else
		{
			// Calculate correction
			cbvt_v_corr = CGEN_GetCorrection("bvt_v");
			CBVT_CorrectV(1 / cbvt_v_corr[0], cbvt_v_corr[1]);
		}
		
		CBVT_PrintVCal();
	}
}

function CBVT_CalibrateI()
{
	cbvt_MaxP = 0;
	//
	var Vmax = Math.round(cbvt_Ilimit1 * cbvt_R * 0.9 / 1000);
	cbvt_Vmin = 500;
	cbvt_Vmax = (Vmax > cbvt_VmaxAC) ? cbvt_VmaxAC : Vmax;
	cbvt_Vstp = Math.round((cbvt_Vmax - cbvt_Vmin) / 10);
	
	CBVT_CalibrateIx("bvt_i");
}

function CBVT_CalibrateIP()
{
	cbvt_MaxP = 1;
	//
	var Vmax = Math.round(cbvt_Ilimit2 * cbvt_RP * 0.9 / 1000);
	cbvt_Vmin = 500;
	cbvt_Vmax = (Vmax > cbvt_VmaxAC) ? cbvt_VmaxAC : Vmax;
	cbvt_Vstp = Math.round((cbvt_Vmax - cbvt_Vmin) / 10);
	
	CBVT_CalibrateIx("bvt_ip");
}

function CBVT_CalibrateIx(FileName)
{
	CBVT_Prepare();
	CBVT_ResetICal();
	
	if (CBVT_Collect(cbvt_VoltageValues, cbvt_Iterations, 2))
	{
		CBVT_SaveI(FileName);
		
		// Plot relative error distribution
		scattern(cbvt_i_sc, cbvt_i_err, "Current (in mA)", "Error (in %)", "Current relative error");
		
		if (CGEN_UseQuadraticCorrection())
		{
			// Calculate correction
			cbvt_i_corr = CGEN_GetCorrection2(FileName);
			CBVT_Correct2I(cbvt_i_corr[0], cbvt_i_corr[1], cbvt_i_corr[2]);
		}
		else
		{
			// Calculate correction
			cbvt_i_corr = CGEN_GetCorrection(FileName);
			CBVT_CorrectI(1 / cbvt_i_corr[0], cbvt_i_corr[1]);
		}
		
		CBVT_PrintICal();
	}
}

function CBVT_VerifyV()
{
	cbvt_MaxP = 0;
	//
	cbvt_Vmin	= 500;
	cbvt_Vmax	= cbvt_VmaxAC;
	cbvt_Vstp	= 500;
	
	CBVT_Prepare();
	
	if (CBVT_Collect(cbvt_VoltageValues, cbvt_Iterations, 1))
	{
		CBVT_SaveV("bvt_v_fixed");
		
		// Plot relative error distribution
		scattern(cbvt_v_sc, cbvt_v_err, "Voltage (in V)", "Error (in %)", "Voltage relative error");
		
		// Plot summary error distribution
		scattern(cbvt_v_sc, cbvt_v_err_sum, "Voltage (in V)", "Error (in %)", "Voltage summary error");
	}
}

function CBVT_VerifyI()
{
	cbvt_MaxP = 0;
	//
	var Vmax = Math.round(cbvt_Ilimit1 * cbvt_R * 0.9 / 1000);
	cbvt_Vmin = 500;
	cbvt_Vmax = (Vmax > cbvt_VmaxAC) ? cbvt_VmaxAC : Vmax;
	cbvt_Vstp = Math.round((cbvt_Vmax - cbvt_Vmin) / 10);
	
	CBVT_VerifyIx("bvt_i_fixed");
}

function CBVT_VerifyIP()
{
	cbvt_MaxP = 1;
	//
	var Vmax = Math.round(cbvt_Ilimit2 * cbvt_RP * 0.9 / 1000);
	cbvt_Vmin = 500;
	cbvt_Vmax = (Vmax > cbvt_VmaxAC) ? cbvt_VmaxAC : Vmax;
	cbvt_Vstp = Math.round((cbvt_Vmax - cbvt_Vmin) / 10);
	
	CBVT_VerifyIx("bvt_ip_fixed");
}

function CBVT_VerifyIx(FileName)
{
	CBVT_Prepare();
	
	if (CBVT_Collect(cbvt_VoltageValues, cbvt_Iterations, 2))
	{
		CBVT_SaveI(FileName);
		
		// Plot relative error distribution
		scattern(cbvt_i_sc, cbvt_i_err, "Current (in mA)", "Error (in %)", "Current relative error");
	}
}

function CBVT_CalibrateVDC()
{
	cbvt_Vmin	= 500;
	cbvt_Vmax	= cbvt_VmaxDC;
	cbvt_Vstp	= 500;
	
	CBVT_Prepare();
	CBVT_ResetVCal();
	
	if (CBVT_CollectDC(cbvt_VoltageValues, cbvt_Iterations, 1))
	{
		CBVT_SaveV("bvt_v_dc");
		
		// Plot relative error distribution
		scattern(cbvt_v_sc, cbvt_v_err, "Voltage (in V)", "Error (in %)", "DC voltage relative error");
		
		if (CGEN_UseQuadraticCorrection())
		{
			// Calculate correction
			cbvt_v_corr = CGEN_GetCorrection2("bvt_v_dc");
			CBVT_Correct2V(cbvt_v_corr[0], cbvt_v_corr[1], cbvt_v_corr[2]);	
		}
		else
		{
			// Calculate correction
			cbvt_v_corr = CGEN_GetCorrection("bvt_v_dc");
			CBVT_CorrectV(1 / cbvt_v_corr[0], cbvt_v_corr[1]);
		}
		
		CBVT_PrintVCal();
	}
}

function CBVT_CalibrateIDC()
{
	var Vmax = Math.round((cbvt_DC_LowI ? 100 : 5000) * cbvt_RDC * 0.9 / 1e6);
	cbvt_Vmin = 500;
	cbvt_Vmax = (Vmax > cbvt_VmaxDC) ? cbvt_VmaxDC : Vmax;
	cbvt_Vstp = Math.round((cbvt_Vmax - cbvt_Vmin) / 10);
	
	CBVT_Prepare();
	CBVT_ResetICalDC();
	
	if (CBVT_CollectDC(cbvt_VoltageValues, cbvt_Iterations, 2))
	{
		CBVT_SaveI("bvt_i_dc");
		
		// Plot relative error distribution
		scattern(cbvt_i_sc, cbvt_i_err, "Voltage (in V)", "Error (in %)", "DC current relative error");
		
		if (CGEN_UseQuadraticCorrection())
		{
			// Calculate correction
			cbvt_i_corr = CGEN_GetCorrection2("bvt_i_dc");
			CBVT_Correct2IDC(cbvt_i_corr[0], cbvt_i_corr[1], cbvt_i_corr[2]);
		}
		else
		{
			print("Linear correction not supported for DC current.");
			return;
		}
		
		CBVT_PrintICalDC();
	}
}

function CBVT_VerifyVDC()
{
	cbvt_Vmin	= 500;
	cbvt_Vmax	= cbvt_VmaxDC;
	cbvt_Vstp	= 500;
	
	CBVT_Prepare();
	
	if (CBVT_CollectDC(cbvt_VoltageValues, cbvt_Iterations, 1))
	{
		CBVT_SaveV("bvt_v_dc_fixed");
		
		// Plot relative error distribution
		scattern(cbvt_v_sc, cbvt_v_err, "Voltage (in V)", "Error (in %)", "DC voltage relative error");
	}
}

function CBVT_VerifyIDC()
{
	var Vmax = Math.round((cbvt_DC_LowI ? 100 : 5000) * cbvt_RDC * 0.9 / 1e6);
	cbvt_Vmin = 500;
	cbvt_Vmax = (Vmax > cbvt_VmaxDC) ? cbvt_VmaxDC : Vmax;
	cbvt_Vstp = Math.round((cbvt_Vmax - cbvt_Vmin) / 10);
	
	CBVT_Prepare();
	
	if (CBVT_CollectDC(cbvt_VoltageValues, cbvt_Iterations, 2))
	{
		CBVT_SaveI("bvt_i_dc_fixed");
		
		// Plot relative error distribution
		scattern(cbvt_i_sc, cbvt_i_err, "Voltage (in V)", "Error (in %)", "DC current relative error");
	}
}

function CBVT_Collect(VoltageValues, IterationsCount, PrintMode)
{
	if (cbvt_MaxP == 0)
	{
		print("Load resistance set to " + (cbvt_R / 1000) + " kOhms");
		print("Shunt resistance set to " + cbvt_Shunt + " Ohms");
	}
	else
	{
		print("Load resistance set to " + (cbvt_RP / 1000) + " kOhms");
		print("Shunt resistance set to " + cbvt_ShuntP + " Ohms");
	}
	print("-----------");
	
	// Acquire mode
	TEK_AcquireAvg(4);
	// Init measurement
	CBVT_TekMeasurement(cbvt_chMeasureV);
	CBVT_TekMeasurement(cbvt_chMeasureI);
	// Horizontal settings
	TEK_Horizontal("1e-3", "-2e-3");
	// Init trigger
	TEK_TriggerPulseInit(cbvt_chMeasureV, "100");
	sleep(500);
	
	cbvt_cntTotal = IterationsCount * VoltageValues.length;
	cbvt_cntDone = 0;
	
	// Power-up
	if (dev.r(192) == 0) dev.c(1);
	if (dev.r(192) != 4)
	{
		print("Power-up error");
		return 0;
	}
	
	// Global configuration
	dev.w(128, 3);																// Test type - reverse pulse
	dev.w(130, ((cbvt_MaxP == 0) ? cbvt_Ilimit1 : cbvt_Ilimit2) * 10);			// Current limit
	dev.w(132, bvt_test_time);													// Plate time
	dev.w(133, 30);																// Rise rate
	dev.w(134, 500);															// Start voltage
	dev.w(136, Math.round(50 / ((cbvt_MaxP == 0) ? cbvt_Freq1 : cbvt_Freq2)));	// Frequency divisor
	
	CBVT_TekScale(cbvt_chMeasureV, cbvt_Vmax);
	CBVT_TekScale(cbvt_chMeasureI, (cbvt_MaxP == 0) ? (cbvt_Vmax / cbvt_R * cbvt_Shunt) : (cbvt_Vmax / cbvt_RP * cbvt_ShuntP));
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < VoltageValues.length; j++)
		{
			if (cbvt_UseRangeTuning)
			{
				CBVT_TekScale(cbvt_chMeasureV, VoltageValues[j]);
				CBVT_TekScale(cbvt_chMeasureI, (cbvt_MaxP == 0) ? (VoltageValues[j] / cbvt_R * cbvt_Shunt) : (VoltageValues[j] / cbvt_RP * cbvt_ShuntP));
			}
			
			TEK_TriggerLevelF(VoltageValues[j] / 2);
			sleep(200);
			
			dev.w(131, VoltageValues[j]);
			CBVT_Probe(PrintMode);
			
			if (anykey()) return 0;
		}
	}
	
	return 1;
}

function CBVT_CollectDC(VoltageValues, IterationsCount, PrintMode)
{
	print("Load resistance set to " + (cbvt_RDC / 1000) + " kOhms");
	print("Shunt resistance set to " + cbvt_ShuntDC + " Ohms");
		
	// Acquire mode
	TEK_AcquireSample();
	// Init measurement
	CBVT_TekMeasurement(cbvt_chMeasureV);
	CBVT_TekMeasurement(cbvt_chMeasureI);
	// Horizontal settings
	TEK_Horizontal("0.5", "1");
	// Init trigger
	TEK_TriggerInit(cbvt_chMeasureV, "100");
	sleep(500);
	
	cbvt_cntTotal = IterationsCount * VoltageValues.length;
	cbvt_cntDone = 0;
	
	// Power-up
	if (dev.r(192) == 0) dev.c(1);
	if (dev.r(192) != 4)
	{
		print("Power-up error");
		return 0;
	}
	
	// Global configuration
	dev.w(128, 4);			// Test type - DC
	dev.w(138, 2000);		// Plate time
	dev.w(141, 30);			// Rise rate
	dev.w(140, 500);		// Start voltage
	dev.w(139, (cbvt_DC_LowI) ? 100 : 5000);		// Limit current
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < VoltageValues.length; j++)
		{
			// Configure channels
			if (cbvt_UseRangeTuning)
			{
				CBVT_TekScale(cbvt_chMeasureV, VoltageValues[j]);
				CBVT_TekScale(cbvt_chMeasureI, VoltageValues[j] / cbvt_RDC * cbvt_ShuntDC);
			}
			
			TEK_TriggerLevelF(VoltageValues[j] / 2);
			sleep(1000);
			
			dev.w(140, VoltageValues[j]);
			CBVT_ProbeDC(PrintMode);
			
			if (anykey()) return 0;
		}
	}
	
	return 1;
}

function CBVT_MeasureV(Channel)
{
	var f = TEK_Measure(Channel);
	if (Math.abs(f) > 2e+4)
		f = 0;
	return Math.round(f);
}

function CBVT_MeasureI(Channel)
{
	var f = TEK_Measure(Channel);
	if (Math.abs(f) > 2e+4)
		f = 0;
	return (f / ((cbvt_MaxP == 0) ? cbvt_Shunt : cbvt_ShuntP) * 1000).toFixed(2);
}

function CBVT_MeasureIDC(Channel)
{
	var f = TEK_Measure(Channel);
	if (Math.abs(f) > 2e+4)
		f = 0;
	return ((f * 1e6) / cbvt_ShuntDC).toFixed(2);
}

function CBVT_Probe(PrintMode)
{
	dev.c(100);
	while (dev.r(192) == 5) sleep(100);
	
	sleep(500);
	
	var f_v = CBVT_MeasureV(cbvt_chMeasureV);
	var f_i = CBVT_MeasureI(cbvt_chMeasureI);
	
	var v = Math.abs(dev.rs(198));
	var i = Math.abs(dev.rs(199) / 10);
	
	cbvt_v.push(v);
	cbvt_i.push(i);
	//
	cbvt_v_sc.push(f_v);
	cbvt_i_sc.push(f_i);
	//
	cbvt_v_err.push(((v - f_v) / f_v * 100).toFixed(2));
	cbvt_i_err.push(((i - f_i) / f_i * 100).toFixed(2));
	
	// Summary error
	E0 = Math.sqrt(Math.pow(EUosc, 2) + Math.pow(ER, 2));
	cbvt_v_err_sum.push(1.1 * Math.sqrt(Math.pow((v - f_v) / f_v * 100, 2) + Math.pow(E0, 2)));
	cbvt_i_err_sum.push(1.1 * Math.sqrt(Math.pow((i - f_i) / f_i * 100, 2) + Math.pow(E0, 2)));
	
	switch (PrintMode)
	{
		case 1:
			print("V,     V: " + v);
			print("Vtek,  V: " + f_v);
			break;
		
		case 2:
			print("I,    mA: " + i);
			print("Itek, mA: " + f_i);
			break;
	}
	
	cbvt_cntDone++;
	if (PrintMode)
		print("-- result " + cbvt_cntDone + " of " + cbvt_cntTotal + " --");
	
	sleep(bvt_pulse_sleep);
}

function CBVT_ProbeDC(PrintMode)
{
	dev.c(100);
	while (dev.r(192) == 5) sleep(100);
	
	sleep(3000);
	
	var f_v = CBVT_MeasureV(cbvt_chMeasureV);
	var f_i = CBVT_MeasureIDC(cbvt_chMeasureI);
	
	var v = Math.abs(dev.rs(198));
	var i = dev.r(199);
	
	cbvt_v.push(v);
	cbvt_i.push(i);
	//
	cbvt_v_sc.push(f_v);
	cbvt_i_sc.push(f_i);
	//
	cbvt_v_err.push(((v - f_v) / f_v * 100).toFixed(2));
	cbvt_i_err.push(((i - f_i) / f_i * 100).toFixed(2));
	
	switch (PrintMode)
	{
		case 1:
			print("V,     V: " + v);
			print("Vtek,  V: " + f_v);
			break;
		
		case 2:
			print("I,    uA: " + i);
			print("Itek, uA: " + f_i);
			break;
	}
	
	cbvt_cntDone++;
	if (PrintMode)
		print("-- result " + cbvt_cntDone + " of " + cbvt_cntTotal + " --");
	
	sleep(1000);
}

function CBVT_Init(portBVT, portTek, channelMeasureV, channelMeasureI)
{	
	if (channelMeasureV < 1 || channelMeasureV > 4 ||
		channelMeasureI < 1 || channelMeasureI > 4)
	{
		print("Wrong channel numbers");
		return;
	}
	
	// Copy channel information
	cbvt_chMeasureV = channelMeasureV;
	cbvt_chMeasureI = channelMeasureI;
	
	// Init BVT
	dev.Disconnect();
	dev.Connect(portBVT);
	
	// Init Tektronix
	TEK_PortInit(portTek);
	
	// Init channels
	TEK_ChannelInit(cbvt_chMeasureV, "1000", "100");
	TEK_ChannelInit(cbvt_chMeasureI, "1", "1");
	
	// Display channels
	for (var i = 1; i <= 4; i++)
	{
		if (i == cbvt_chMeasureV || i == cbvt_chMeasureI)
			TEK_ChannelOn(i);
		else
			TEK_ChannelOff(i);
	}
}

function CBVT_TekMeasurement(Channel)
{
	TEK_Send("measurement:meas" + Channel + ":source ch" + Channel);
	TEK_Send("measurement:meas" + Channel + ":type maximum");
}

function CBVT_TekScale(Channel, Value)
{
	TEK_ChannelScale(Channel, Value);
}

function CBVT_Prepare()
{
	// Reinit vars
	cbvt_VoltageValues = CGEN_GetRange(cbvt_Vmin, cbvt_Vmax, cbvt_Vstp);
	cbvt_RangeI = (cbvt_MaxP == 0) ? 1 : 2;
	
	// Collect data
	CBVT_ResetA();
}

function CBVT_ResetA()
{
	// Results storage
	cbvt_v = [];
	cbvt_i = [];

	// Tektronix data
	cbvt_v_sc = [];
	cbvt_i_sc = [];

	// Relative error
	cbvt_v_err = [];
	cbvt_i_err = [];
	
	// Summary error
	cbvt_v_err_sum = [];
	cbvt_i_err_sum = [];

	// Correction
	cbvt_v_corr = [];
	cbvt_i_corr = [];
}

function CBVT_SaveV(NameV)
{
	CGEN_SaveArrays(NameV, cbvt_v, cbvt_v_sc, cbvt_v_err, cbvt_v_err_sum);
}

function CBVT_SaveI(NameI)
{
	CGEN_SaveArrays(NameI, cbvt_i, cbvt_i_sc, cbvt_i_err, cbvt_i_err_sum);
}

function CBVT_CalV1(K, Offset)
{
	dev.w(104, Math.round(K * 1000));
	dev.w(105, 1000);
	dev.ws(114, Math.round(Offset * 10));
}

function CBVT_Cal2V1(P2, P1, P0)
{
	dev.ws(104, Math.round(P2 * 1e6));
	dev.w(105, Math.round(P1 * 1000));
	dev.ws(114, Math.round(P0 * 10));
}

function CBVT_CalV2(K, Offset)
{
	dev.w(106, Math.round(K * 1000));
	dev.w(107, 1000);
	dev.ws(115, Math.round(Offset * 10));
}

function CBVT_Cal2V2(P2, P1, P0)
{
	dev.ws(106, Math.round(P2 * 1e6));
	dev.w(107, Math.round(P1 * 1000));
	dev.ws(115, Math.round(P0 * 10));
}

function CBVT_CalI1(K, Offset)
{
	dev.w(96, Math.round(K * 1000));
	dev.w(97, 1000);
	dev.ws(116, Math.round(Offset * 1000));
}

function CBVT_Cal2I1(P2, P1, P0)
{
	dev.ws(96, Math.round(P2 * 1e6));
	dev.w(97, Math.round(P1 * 1000));
	dev.ws(116, Math.round(P0 * 1000));
}

function CBVT_CalI2(K, Offset)
{
	dev.w(98, Math.round(K * 1000));
	dev.w(99, 1000);
	dev.ws(117, Math.round(Offset * 1000));
}

function CBVT_Cal2I2(P2, P1, P0)
{
	dev.ws(98, Math.round(P2 * 1e6));
	dev.w(99, Math.round(P1 * 1000));
	dev.ws(117, Math.round(P0 * 1000));
}

function CBVT_CalI3(K, Offset)
{
	dev.w(112, Math.round(K * 1000));
	dev.w(113, 1000);
	dev.ws(118, Math.round(Offset * 1000));
}

function CBVT_Cal2I3(P2, P1, P0)
{
	dev.ws(112, Math.round(P2 * 1e6));
	dev.w(113, Math.round(P1 * 1000));
	dev.ws(118, Math.round(P0 * 1000));
}

function CBVT_Cal2IDC(P2, P1, P0)
{
	dev.ws(108, Math.round(P2 * 1e6));
	dev.w(109, Math.round(P1 * 1000));
	dev.ws(110, Math.round(P0 * 1000));
}

function CBVT_Cal2ILowDC(P2, P1, P0)
{
	dev.ws(112, Math.round(P2 * 1e6));
	dev.w(113, Math.round(P1 * 1000));
	dev.ws(118, Math.round(P0 * 1000));
}

function CBVT_PrintVCal()
{
	if (CGEN_UseQuadraticCorrection())
	{
		switch (cbvt_RangeV)
		{
			case 1:
				print("Range [ < 500V]");
				print("V1 P2 x1e6:	" + dev.rs(104));
				print("V1 P1 x1000:	" + dev.r(105));
				print("V1 P0 x10:	" + dev.rs(114));
				break;
			case 2:
				print("Range [500-" + cbvt_VmaxAC + "V]");
				print("V2 P2 x1e6:	" + dev.rs(106));
				print("V2 P1 x1000:	" + dev.r(107));
				print("V2 P0 x10:	" + dev.rs(115));
				break;
			default:
				print("Incorrect V range.");
				break;
		}
	}
	else
	{
		switch (cbvt_RangeV)
		{
			case 1:
				print("Range [ < 500V]");
				print("V1 K:		" + (dev.r(104) / dev.r(105)));
				print("V1 Offset:	" + (dev.rs(114) / 10));
				break;
			case 2:
				print("Range [500-" + cbvt_VmaxAC + "V]");
				print("V2 K:		" + (dev.r(106) / dev.r(107)));
				print("V2 Offset:	" + (dev.rs(115) / 10));
				break;
			default:
				print("Incorrect V range.");
				break;
		}
	}
}

function CBVT_PrintICal()
{
	if (CGEN_UseQuadraticCorrection())
	{
		switch (cbvt_RangeI)
		{
			case 1:
				print("Range [ < 30mA]");
				print("I1 P2 x1e6:	" + dev.rs(96));
				print("I1 P1 x1000:	" + dev.r(97));
				print("I1 P0 x1000:	" + dev.rs(116));
				break;
			case 2:
				print("Range [30-300mA]");
				print("I2 P2 x1e6:	" + dev.rs(98));
				print("I2 P1 x1000:	" + dev.r(99));
				print("I2 P0 x1000:	" + dev.rs(117));
				break;
			case 3:
				print("Range [ > 300mA]");
				print("I3 P2 x1e6:	" + dev.rs(112));
				print("I3 P1 x1000:	" + dev.r(113));
				print("I3 P0 x1000:	" + dev.rs(118));
				break;
			default:
				print("Incorrect I range.");
				break;
		}
	}
	else
	{
		switch (cbvt_RangeI)
		{
			case 1:
				print("Range [ < 30mA]");
				print("I1 K:		" + (dev.r(96) / dev.r(97)));
				print("I1 Offset:	" + (dev.rs(116) / 1000));
				break;
			case 2:
				print("Range [30-300mA]");
				print("I2 K:		" + (dev.r(98) / dev.r(99)));
				print("I2 Offset:	" + (dev.rs(117) / 1000));
				break;
			case 3:
				print("Range [ > 300mA]");
				print("I3 K:		" + (dev.r(112) / dev.r(113)));
				print("I3 Offset:	" + (dev.rs(118) / 1000));
				break;
			default:
				print("Incorrect I range.");
				break;
		}
	}
}

function CBVT_PrintICalDC()
{
	if (CGEN_UseQuadraticCorrection())
	{
		if (cbvt_DC_LowI)
		{
			print("Range [ < 100uA]");
			print("IL P2 x1e6:	" + dev.rs(112));
			print("IL P1 x1000:	" + dev.r(113));
			print("IL P0 x1000:	" + dev.rs(118));
		}
		else
		{
			print("Range [100-5000uA]");
			print("I  P2 x1e6:	" + dev.rs(108));
			print("I  P1 x1000:	" + dev.r(109));
			print("I  P0 x1000:	" + dev.rs(110));
		}
	}
	else
		print("Linear correction not supported for DC current.");
}

function CBVT_ResetVCal()
{
	if (CGEN_UseQuadraticCorrection())
	{
		switch (cbvt_RangeV)
		{
			case 1:
				CBVT_Cal2V1(0, 1, 0);
				print("Range [ < 500V]");
				print("Voltage calibration reset done");
				break;
			case 2:
				CBVT_Cal2V2(0, 1, 0);
				print("Range [500-" + cbvt_VmaxAC + "V]");
				print("Voltage calibration reset done");
				break;
			default:
				print("Incorrect V range.");
				break;
		}
	}
	else
	{
		switch (cbvt_RangeV)
		{
			case 1:
				CBVT_CalV1(1, 0);
				print("Range [ < 500V]");
				print("Voltage calibration reset done");
				break;
			case 2:
				CBVT_CalV2(1, 0);
				print("Range [500-" + cbvt_VmaxAC + "V]");
				print("Voltage calibration reset done");
				break;
			default:
				print("Incorrect V range.");
				break;
		}
	}
}

function CBVT_ResetICal()
{
	if (CGEN_UseQuadraticCorrection())
	{
		switch (cbvt_RangeI)
		{
			case 1:
				CBVT_Cal2I1(0, 1, 0);
				print("Range [ < 30mA]");
				print("Current calibration reset done");
				break;
			case 2:
				CBVT_Cal2I2(0, 1, 0);
				print("Range [30-300mA]");
				print("Current calibration reset done");
				break;
			case 3:
				CBVT_Cal2I3(0, 1, 0);
				print("Range [ > 300mA]");
				print("Current calibration reset done");
				break;
			default:
				print("Incorrect I range.");
				break;
		}
	}
	else
	{
		switch (cbvt_RangeI)
		{
			case 1:
				CBVT_CalI1(1, 0);
				print("Range [ < 30mA]");
				print("Current calibration reset done");
				break;
			case 2:
				CBVT_CalI2(1, 0);
				print("Range [30-300mA]");
				print("Current calibration reset done");
				break;
			case 3:
				CBVT_CalI3(1, 0);
				print("Range [ > 300mA]");
				print("Current calibration reset done");
				break;
			default:
				print("Incorrect I range.");
				break;
		}
	}
}

function CBVT_ResetICalDC()
{
	if (CGEN_UseQuadraticCorrection())
	{
		if (cbvt_DC_LowI)
		{
			CBVT_Cal2ILowDC(0, 1, 0);
			print("Range [ < 100uA]");
			print("Current calibration reset done");
		}
		else
		{
			CBVT_Cal2IDC(0, 1, 0);
			print("Range [100-5000uA]");
			print("Current calibration reset done");
		}
	}
	else
		print("Linear correction not supported for DC current.");
}

function CBVT_CorrectV(K, Offset)
{
	switch (cbvt_RangeV)
	{
		case 1:
			CBVT_CalV1(K, Offset);
			print("Range [ < 500V]");
			print("Voltage calibration updated");
			break;
		case 2:
			CBVT_CalV2(K, Offset);
			print("Range [500-" + cbvt_VmaxAC + "V]");
			print("Voltage calibration updated");
			break;
		default:
			print("Incorrect V range.");
			break;
	}
}

function CBVT_Correct2V(P2, P1, P0)
{
	switch (cbvt_RangeV)
	{
		case 1:
			CBVT_Cal2V1(P2, P1, P0);
			print("Range [ < 500V]");
			print("Voltage calibration updated");
			break;
		case 2:
			CBVT_Cal2V2(P2, P1, P0);
			print("Range [500-" + cbvt_VmaxAC + "V]");
			print("Voltage calibration updated");
			break;
		default:
			print("Incorrect V range.");
			break;
	}
}

function CBVT_CorrectI(K, Offset)
{
	switch (cbvt_RangeI)
	{
		case 1:
			CBVT_CalI1(K, Offset);
			print("Range [ < 30mA]");
			print("Current calibration updated");
			break;
		case 2:
			CBVT_CalI2(K, Offset);
			print("Range [30-300mA]");
			print("Current calibration updated");
			break;
		case 3:
			CBVT_CalI3(K, Offset);
			print("Range [ > 300mA]");
			print("Current calibration updated");
			break;
		default:
			print("Incorrect I range.");
			break;
	}
}

function CBVT_Correct2I(P2, P1, P0)
{
	switch (cbvt_RangeI)
	{
		case 1:
			CBVT_Cal2I1(P2, P1, P0);
			print("Range [ < 30mA]");
			print("Current calibration updated");
			break;
		case 2:
			CBVT_Cal2I2(P2, P1, P0);
			print("Range [30-300mA]");
			print("Current calibration updated");
			break;
		case 3:
			CBVT_Cal2I3(P2, P1, P0);
			print("Range [ > 300mA]");
			print("Current calibration updated");
			break;
		default:
			print("Incorrect I range.");
			break;
	}
}

function CBVT_Correct2IDC(P2, P1, P0)
{
	if (cbvt_DC_LowI)
	{
		CBVT_Cal2ILowDC(P2, P1, P0);
		print("Range [ < 100uA]");
		print("Current calibration updated");
	}
	else
	{
		CBVT_Cal2IDC(P2, P1, P0);
		print("Range [100-5000uA]");
		print("Current calibration updated");
	}
}
