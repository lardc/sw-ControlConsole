include("TestTOU.js")
include("Tektronix.js")
include("CalGeneral.js")

// Input params
ctou_Imax = 1250;	// MAX DUT Current [A]
ctou_Ri = 1e-3;		// Current shunt resistance

// Calibrate I
ctou_Imin = 160;
ctou_Imax = ctou_Imax;
ctou_Istp = 60;

// Counters
ctou_cntTotal = 0;
ctou_cntDone = 0;

// Iterations
ctou_Iterations = 2;

// Channels
ctou_chMeasureI = 1;
ctou_chSync = 2;

ctou_i_array = [];

// Results storage
ctou_i = [];
ctou_i_set = [];

// Tektronix data
ctou_i_sc = [];

// Relative error
ctou_i_err = [];
ctou_iset_err = [];

// Correction
ctou_i_corr = [];

// Timings
ctou_t_on = [];
ctou_t_gd = [];

ctou_UseAvg = 1;

function CTOU_Init(portTOU, portTek, channelMeasureI, channelSync)
{
	if (channelMeasureI < 1 || channelMeasureI > 4)
	{
		print("Wrong channel numbers");
		return;
	}

	// Copy channel information
	ctou_chMeasureI = channelMeasureI;
	ctou_chSync = channelSync;

	// Init TOU
	dev.Disconnect();
	dev.Connect(portTOU);

	// Init Tektronix
	TEK_PortInit(portTek);

	// Tektronix init
	// Init channels
	TEK_ChannelInit(ctou_chMeasureI, "1", "0.1");
	TEK_ChannelInit(ctou_chSync, "1", "1");
	// Init trigger
	TEK_TriggerInit(ctou_chSync, "2");
	// Horizontal settings
	TEK_Horizontal("10e-6", "40e-6");

	// Display channels
	for (var i = 1; i <= 4; i++)
	{
		if (i == ctou_chMeasureI || i == ctou_chSync)
			TEK_ChannelOn(i);
		else
			TEK_ChannelOff(i);
	}

	CTOU_TekCursor(ctou_chMeasureI);
	
	// Init measurement
	CTOU_Measure(ctou_chMeasureI, "4");
}

function CTOU_CalibrateI()
{
	// Collect data
	CTOU_ResetA();
	CTOU_ResetCal();

	// Reload values
	var CurrentArray = CGEN_GetRange(ctou_Imin, ctou_Imax, ctou_Istp);

	if (CTOU_Collect(CurrentArray, ctou_Iterations))
	{
		CTOU_SaveI("tou_i");
		CTOU_SaveIset("tou_iset");

		// Plot relative error distribution
		scattern(ctou_i_sc, ctou_i_err, "Current (in A)", "Error (in %)", "Current relative error");
		sleep(200);
		scattern(ctou_i_set, ctou_iset_err, "Current (in A)", "Error (in %)", "Current setpoint relative error");

		// Calculate correction
		ctou_i_corr = CGEN_GetCorrection2("tou_i");
		CTOU_CalI(ctou_i_corr[0], ctou_i_corr[1], ctou_i_corr[2]);
		CTOU_PrintICal();
	}
}

function CTOU_VerifyI()
{
	// Collect data
	CTOU_ResetA();

	// Collect data
	var CurrentArray = CGEN_GetRange(ctou_Imin, ctou_Imax, ctou_Istp);

	if (CTOU_Collect(CurrentArray, ctou_Iterations))
	{
		CTOU_SaveI("tou_i_fixed");
		CTOU_SaveIset("tou_iset_fixed");

		// Plot relative error distribution
		scattern(ctou_i_sc, ctou_i_err, "Current (in A)", "Error (in %)", "Current relative error");
		sleep(200);
		scattern(ctou_i_set, ctou_iset_err, "Current (in A)", "Error (in %)", "Current setpoint relative error");
	}
}

function CTOU_TekCursor(Channel)
{
	TEK_Send("cursor:select:source ch" + Channel);
	TEK_Send("cursor:function vbars");
	TEK_Send("cursor:vbars:position1 80e-6");
	TEK_Send("cursor:vbars:position2 80e-6");
}

function CTOU_Measure(Channel, Resolution)
{
	TEK_Send("cursor:select:source ch" + Channel);
	sleep(500);

	var f = TEK_Exec("cursor:vbars:hpos2?");
	if (Math.abs(f) > 2e+4)
		f = 0;
	return parseFloat(f).toFixed(Resolution);
}

function CTOU_Collect(CurrentValues, IterationsCount)
{
	ctou_cntTotal = IterationsCount * CurrentValues.length;
	ctou_cntDone = 1;

	var AvgNum;
	if (ctou_UseAvg)
	{
		AvgNum = 4;
		TEK_AcquireAvg(AvgNum);
	}
	else
	{
		AvgNum = 1;
		TEK_AcquireSample();
	}
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < CurrentValues.length; j++)
		{
			print("-- result " + ctou_cntDone++ + " of " + ctou_cntTotal + " --");
			print("Iset, A: " + CurrentValues[j]);
			
			CTOU_TekScale(ctou_chMeasureI, (CurrentValues[j] * ctou_Ri));
			TEK_TriggerInit(ctou_chSync, 2);
			sleep(1500);

			ctou_i_set.push(CurrentValues[j]);

			var tou_print_copy		= tou_print;
			var tou_printError_copy	= tou_printError;
			//
			tou_print = 0;
			tou_printError = 0;

			for (var k = 0; k < AvgNum; k++)
			{
				TOU_Measure(CurrentValues[j]);
				sleep(2000);
			}
			tou_print = tou_print_copy;
			tou_printError = tou_printError_copy;
			
			// Unit data
			var i_read = dev.r(250);
			ctou_i.push(i_read);
			print("Itou, A: " + i_read);
			sleep(1000);

			// Scope data
			var i_sc = Math.round(CTOU_Measure(ctou_chMeasureI, "4") / ctou_Ri, 3);
			ctou_i_sc.push(i_sc);
			print("Itek, A: " + i_sc);

			// Relative error
			ctou_i_err.push(((i_read - i_sc) / i_sc * 100).toFixed(2));
			ctou_iset_err.push(((i_sc - CurrentValues[j]) / CurrentValues[j] * 100).toFixed(2));
			sleep(1000);
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}

	return 1;
}

function CTOU_TekScale(Channel, Value)
{
	// 0.7 - use 70% of full range
	// 7 - number of scope grids in full scale
	var scale = (Value / (0.8 * 7)).toFixed(2);
	TEK_Send("ch" + Channel + ":scale " + parseFloat(scale).toExponential());
}

function CTOU_ResetA()
{
	// Results storage
	ctou_i = [];
	ctou_i_set = [];

	// Tektronix data
	ctou_i_sc = [];

	// Relative error
	ctou_i_err = [];

	// Correction
	ctou_i_corr = [];
}

function CTOU_SaveI(NameI)
{
	CGEN_SaveArrays(NameI, ctou_i, ctou_i_sc, ctou_i_err);
}

function CTOU_SaveIset(NameIset)
{
	CGEN_SaveArrays(NameIset, ctou_i, ctou_i_set, ctou_iset_err);
}

function CTOU_PrintICal()
{
	print("I P2 x1e6:	" + dev.rs(7));
	print("I P1 x1000:	" + dev.r(6));
	print("I P0 x1000:	" + dev.rs(5));
}

function CTOU_ResetCal()
{
	CTOU_CalI(0, 1, 0);
}

function CTOU_CalI(P2, P1, P0)
{
	dev.ws(7, Math.round(P2 * 1e6));
	dev.w(6, Math.round(P1 * 1000));
	dev.ws(5, Math.round(P0));
}
