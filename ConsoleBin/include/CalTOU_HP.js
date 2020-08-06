include("TestTOU_HP.js")
include("Tektronix.js")
include("CalGeneral.js")

// Input params
ctou_Ucal = 1500;	// Available - 600V, 1000V, 1500V
ctou_Imax = 100;	// MAX DUT Current [A *10]
ctou_Ri = 1e-3;		// Current shunt resistance

// Calibrate I
ctou_Imin = 10;
ctou_Imax = ctou_Imax;
ctou_Istp = 10;

// Counters
ctou_cntTotal = 0;
ctou_cntDone = 0;

// Iterations
ctou_Iterations = 1;

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
ctou_i_set_corr = [];

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
	TEK_ChannelInvInit(ctou_chMeasureI, "1", "0.01");
	TEK_ChannelInit(ctou_chSync, "1", "1");
	// Init trigger
	TEK_TriggerInit(ctou_chSync, "4");
	// Horizontal settings
	TEK_Horizontal("5e-6", "20e-6");
	
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
	CTOU_TOSU_Control(0);
	
	// Collect data
	CTOU_ResetA();
	CTOU_ResetCal();

	// Reload values
	var CurrentArray = CGEN_GetRange(ctou_Imin, ctou_Imax, ctou_Istp);

	if (CTOU_Collect(CurrentArray, ctou_Iterations))
	{
		CTOU_SaveI("touhp_i");
		CTOU_SaveIset("touhp_iset");

		// Plot relative error distribution
		scattern(ctou_i_sc, ctou_i_err, "Current (in A)", "Error (in %)", "Current relative error");
		sleep(200);
		scattern(ctou_i_set, ctou_iset_err, "Current (in A)", "Error (in %)", "Current setpoint relative error");

		// Calculate correction
		ctou_i_corr = CGEN_GetCorrection2("touhp_i");
		CTOU_CalI(ctou_i_corr[0], ctou_i_corr[1], ctou_i_corr[2]);
		CTOU_PrintICal();
		
		ctou_i_set_corr = CGEN_GetCorrection2("touhp_iset");
		CTOU_CalI_Set(ctou_i_set_corr[0], ctou_i_set_corr[1], ctou_i_set_corr[2]);
		CTOU_PrintISetCal();
	}
	
	CTOU_TOSU_Control(1);
}

function CTOU_VerifyI()
{
	CTOU_TOSU_Control(0);
	
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
	
	CTOU_TOSU_Control(1);
}

function CTOU_TekCursor(Channel)
{
	TEK_Send("cursor:select:source ch" + Channel);
	TEK_Send("cursor:function vbars");
	TEK_Send("cursor:vbars:position1 30e-6");
	TEK_Send("cursor:vbars:position2 30e-6");
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
			
			CTOU_TekScale(ctou_chMeasureI, (CurrentValues[j] * ctou_Ri));
			TEK_TriggerInit(ctou_chSync, 4);
			sleep(1500);

			//
			var tou_print_copy = tou_print;
			tou_print = 0;

			for (var k = 0; k < AvgNum; k++)
			{
				TOUHP_Measure(ctou_Ucal, CurrentValues[j] * 10);
			}
			
			tou_print = tou_print_copy;
			
			// Set data
			var i_set = dev.r(129) / 10;
			ctou_i_set.push(i_set);
			print("Iset, A: " + i_set);
			
			// Unit data
			var i_read = dev.r(250) / 10;
			ctou_i.push(i_read);
			print("Itou, A: " + i_read);

			// Scope data
			var i_sc = (CTOU_Measure(ctou_chMeasureI, "4") / ctou_Ri).toFixed(2);
			ctou_i_sc.push(i_sc);
			print("Itek, A: " + i_sc);
			
			print(dev.r(190));
			print(dev.r(191));

			// Relative error
			ctou_iset_err.push(((i_sc - i_set) / i_set * 100).toFixed(2));
			ctou_i_err.push(((i_read - i_sc) / i_sc * 100).toFixed(2));
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}

	return 1;
}

function CTOU_TekScale(Channel, Value)
{
	TEK_ChannelScale(Channel, Value);
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
	ctou_iset_err = [];

	// Correction
	ctou_i_corr = [];
	ctou_i_set_corr = [];
}

function CTOU_SaveI(NameI)
{
	CGEN_SaveArrays(NameI, ctou_i, ctou_i_sc, ctou_i_err);
}

function CTOU_SaveIset(NameIset)
{
	CGEN_SaveArrays(NameIset, ctou_i_sc, ctou_i_set, ctou_iset_err);
}

function CTOU_PrintISetCal()
{
	var P2, P1, P0;
	
	switch(ctou_Ucal)
	{
		case 600:
			P2 = dev.r(30);
			P1 = dev.r(31);
			P0 = dev.r(32);
			break;
			
		case 1000:
			P2 = dev.r(33);
			P1 = dev.r(34);
			P0 = dev.r(35);
			break;
			
		case 1500:
			P2 = dev.r(36);
			P1 = dev.r(37);
			P0 = dev.r(38);
			break;
	}
	
	print("I P2 x1e6:	" + P2);
	print("I P1 x1000:	" + P1);
	print("I P0 :		" + P0);
}

function CTOU_PrintICal()
{
	print("I P2 x1e6:	" + dev.rs(5));
	print("I P1 x1000:	" + dev.r(4));
	print("I P0 x1000:	" + dev.rs(3));
}

function CTOU_ResetCal()
{
	CTOU_CalI(0, 1, 0);
	CTOU_CalI_Set(0, 1, 0);
}

function CTOU_CalI_Set(P2, P1, P0)
{
	switch(ctou_Ucal)
	{
		case 600:
			dev.ws(30, Math.round(P2 * 1e6));
			dev.w(31, Math.round(P1 * 1000));
			dev.ws(32, Math.round(P0));
			break;
			
		case 1000:
			dev.ws(33, Math.round(P2 * 1e6));
			dev.w(34, Math.round(P1 * 1000));
			dev.ws(35, Math.round(P0));
			break;
			
		case 1500:
			dev.ws(36, Math.round(P2 * 1e6));
			dev.w(37, Math.round(P1 * 1000));
			dev.ws(38, Math.round(P0));
			break;
	}
}

function CTOU_CalI(P2, P1, P0)
{
	dev.ws(5, Math.round(P2 * 1e6));
	dev.w(4, Math.round(P1 * 1000));
	dev.ws(3, Math.round(P0));
}

function CTOU_TOSU_Control(Control)
{
	if(Control)
		dev.w(29,0);
	else
		dev.w(29,1);
}
