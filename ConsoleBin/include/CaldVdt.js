include("Tektronix.js")
include("CalGeneral.js")
include("TestdVdt.js")

cdvdt_chMeasure = 1;

// For 3d scatter plot use Matlab following commands
// scatter3(x, y, z, 40, z, 'filled');
// colorbar;

// Definition section (modification is dangerous)
cdvdt_def_SetpointCount = 7;
cdvdt_def_VGateMin = 3000;
cdvdt_def_VGateMax = 5000;
// Definition range config
cdvdt_def_RANGE_LOW = 1;
cdvdt_def_RANGE_MID = 2;
cdvdt_def_RANGE_HIGH = 0;
cdvdt_def_SetpointStartAddr = {}
cdvdt_def_SetpointStartAddr[cdvdt_def_RANGE_LOW]  = 320;
cdvdt_def_SetpointStartAddr[cdvdt_def_RANGE_MID]  = 420;
cdvdt_def_SetpointStartAddr[cdvdt_def_RANGE_HIGH] = 30;
//
cdvdt_CalVoltage = 500;
cdvdt_SelectedRange = cdvdt_def_RANGE_HIGH;
cdvdt_HVProbeScale = 100		// Коэффициент деления щупа

// Voltage settings for unit calibration
cdvdt_Vmin = 500;
cdvdt_Vmax = 4500;
cdvdt_Vstp = 500;
//
cdvdt_collect_v = 0;

// Voltage rate points
cdvdt_RatePoint = [200, 500, 1000, 1600, 2000, 2500];

// Use averages in OSC
cdvdt_NO_AVERAGES = 1;
cdvdt_AVERAGES_4 = 4;
cdvdt_AVERAGES_16 = 16;
cdvdt_def_UseAverage = cdvdt_AVERAGES_4;

// Data arrays
cdvdt_scatter = [];
//
cdvdt_scatter05 = [];
cdvdt_scatter10 = [];
cdvdt_scatter16 = [];
cdvdt_scatter20 = [];
cdvdt_scatter25 = [];
//
cdvdt_realRate = [];

function CdVdt_Init(portdVdt, portTek, channelMeasure)
{
	if (channelMeasure < 1 || channelMeasure > 4)
	{
		print("Wrong channel numbers");
		return;
	}
	
	// Copy channel information
	cdvdt_chMeasure = channelMeasure;
	
	// Init dVdt
	dev.Disconnect();
	dev.Connect(portdVdt);
	
	// Init Tektronix
	TEK_PortInit(portTek);
	
	// Tektronix init
	// Init channels
	TEK_ChannelInit(channelMeasure, "1000", "100");
	// Init trigger
	TEK_TriggerInit(channelMeasure, "100");
	// Horizontal settings
	TEK_Horizontal("25e-6", "0");
	
	// Display channels
	for (var i = 1; i <= 4; i++)
	{
		if (i == cdvdt_chMeasure)
			TEK_ChannelOn(i);
		else
			TEK_ChannelOff(i);
	}
	
	// Init cursor
	CdVdt_TekCursor(channelMeasure);
	
	// Init measurement
	CdVdt_TekMeasurement(channelMeasure);
}

function CdVdt_TekCursor(Channel)
{
	TEK_Send("cursor:select:source ch" + Channel);
	TEK_Send("cursor:function vbars");
	TEK_Send("cursor:vbars:position1 100e-6");
	TEK_Send("cursor:vbars:position2 -100e-6");
}

function CdVdt_SwitchToCursor()
{
	TEK_Send("cursor:function vbars");
}

function CdVdt_TekMeasurement(Channel)
{
	TEK_Send("measurement:meas1:source ch" + Channel);
	TEK_Send("measurement:meas1:type maximum");
	TEK_Send("measurement:meas2:source ch" + Channel);
	TEK_Send("measurement:meas2:type rise");
	TEK_Send("measurement:meas3:source ch" + Channel);
	TEK_Send("measurement:meas3:type pk2pk");
}

function CdVdt_SwitchToMeasurement()
{
	TEK_Send("measurement:meas1:type maximum");
}

function CdVdt_MeasureV()
{
	return Math.round(TEK_Exec("cursor:vbars:hpos1?"));
}

function CdVdt_MeasureVfast()
{
	return Math.round(TEK_Measure(1));
}

function CdVdt_MeasureRate()
{
	return Math.round(TEK_Measure(3) * 0.8 / TEK_Exec("measurement:meas2:value?") * 1e-6);
}

function CdVdt_TekVScale(Channel, Voltage)
{
	// 0.7 - use 70% of full range
	// 7 - number of scope grids in full scale
	var scale = Math.round(Voltage / (0.7 * 7));
	TEK_Send("ch" + Channel + ":scale " + scale);
}

function CdVdt_TekHScale(Channel, Voltage, Rate)
{
	var RiseTime = Voltage / Rate * 1e-6;
	TEK_Horizontal(RiseTime.toExponential(), "0");
}

function CdVdt_CellCalibrateRateA(CellArray)
{
	// Power disable all cells
	dev.c(2);
	dev.c(3);
	sleep(1000);
	dev.c(112);
	sleep(1000);
	
	p("Disabling all flyback.");
			
	for (var i = 1; i < 6; i++)
	{
		dVdt_CellCall(i, 2);
		sleep(1000);
	}	
	
	for (var i = 0; i < CellArray.length; i++)
	{
		print("CELL       : " + CellArray[i]);
		if (CdVdt_CellCalibrateRate(CellArray[i]) == 1) 
			return;
		else
			sleep(1000);
	}
}

function CdVdt_CellCalibrateRate(CellNumber)
{
	var GateSetpointV = CGEN_GetRange(cdvdt_def_VGateMin, cdvdt_def_VGateMax, Math.round((cdvdt_def_VGateMax - cdvdt_def_VGateMin) / (cdvdt_def_SetpointCount - 1)));
	
	// Power enable cell
	dVdt_CellCall(CellNumber, 1);
	
	// Configure amplitude
	dVdt_SelectRange(CellNumber, cdvdt_SelectedRange)
	dVdt_CellSetV(CellNumber, cdvdt_CalVoltage);
	CdVdt_TekVScale(cdvdt_chMeasure, cdvdt_CalVoltage);
	TEK_TriggerInit(cdvdt_chMeasure, cdvdt_CalVoltage / 2);
	
	// Wait for power ready
	while (dVdt_CellReadReg(CellNumber, 14) == 0) sleep(100);
	sleep(1000);
	
	// Base DataTable address
	var BaseDTAddress = cdvdt_def_SetpointStartAddr[cdvdt_SelectedRange] + (CellNumber - 1) * cdvdt_def_SetpointCount * 2;
	
	for (var i = 0; i < GateSetpointV.length; i++)
	{
		// Force triggering
		TEK_ForceTrig();
		TEK_TriggerInit(cdvdt_chMeasure, cdvdt_CalVoltage / 2);
		
		// Set gate cdvdt_CalVoltage
		dVdt_CellSetGate(CellNumber, GateSetpointV[i]);
		sleep(500);
		
		// Coarse horizontal setting
		if (i == 0)	
		{ 
			TEK_Horizontal("25e-6", "0");
			sleep(500);
		}
		
		// Start pulse
		dev.c(114);
		while(_dVdt_Active()) sleep(50);
		sleep(1000);
		
		// Fine horizontal setting
		CdVdt_TekHScale(cdvdt_chMeasure, cdvdt_CalVoltage, CdVdt_MeasureRate());
		TEK_TriggerInit(cdvdt_chMeasure, cdvdt_CalVoltage / 2);
		sleep(500);
		
		CdVdt_ClearDisplay();
		
		// Start pulse
		for(var CounterAverages = 0; CounterAverages < cdvdt_def_UseAverage; CounterAverages++)
		{			
			dev.c(114);
			while(_dVdt_Active()) sleep(50);
			sleep(1500);
		}
		
		var v = CdVdt_MeasureVfast();
		var rate = CdVdt_MeasureRate();
		
		if (rate == 0 || rate == Infinity || rate > 3000)
		{
			print("Cell " + CellNumber + ". No pulse at gate voltage " + GateSetpointV[i] + "mV.");
			return 1;
		}
		
		print("Vgt,     mV: " + GateSetpointV[i]);
		print("dV/dt, V/us: " + rate);
		print("Vmax,     V: " + v);
		print("-- result " + (i + 1) + " of " + GateSetpointV.length + " --");
		
		// Write to DataTable
		dev.w(BaseDTAddress + i * 2, GateSetpointV[i]);
		dev.w(BaseDTAddress + i * 2 + 1, rate);
		
		if (anykey()) return 1;
	}
	
	// Power disable cell
	sleep(3000);
	dVdt_CellCall(CellNumber, 2);
	return 0;
}

function CdVdt_Collect(Iterations)
{
	var VoltageArray = CGEN_GetRange(cdvdt_Vmin, cdvdt_Vmax, cdvdt_Vstp);
	
	var cntDone = 0;
	var cntTotal = VoltageArray.length * Iterations * 5;
	
	// Re-enable power
	dev.c(2);
	sleep(1000);
	dev.c(1);
	
	for (var k = 0; k < Iterations; k++)
	{
		for (var i = 0; i < VoltageArray.length; i++)
		{
			dev.w(128, VoltageArray[i])
			CdVdt_TekVScale(cdvdt_chMeasure, VoltageArray[i]);
			TEK_TriggerInit(cdvdt_chMeasure, VoltageArray[i] / 2);
			sleep(500);
			
			for (var j = 101; j <= 105; j++)
			{
				// Coarse horizontal setting
				if (j == 101) TEK_Horizontal("25e-6", "0");
				
				dev.c(j);
				while(_dVdt_Active()) sleep(50);
				sleep(1000);
				
				CdVdt_TekHScale(cdvdt_chMeasure, VoltageArray[i], CdVdt_MeasureRate());
				sleep(500);
				
				dev.c(j);
				while(_dVdt_Active()) sleep(50);
				sleep(1000);
				// Get rate
				var rate = CdVdt_MeasureRate();
				
				if (cdvdt_collect_v)
				{
					// Get voltage
					CdVdt_SwitchToCursor();
					sleep(1000);
					var v = CdVdt_MeasureV();
					//
					CdVdt_SwitchToMeasurement();
				}
				else
					var v = CdVdt_MeasureVfast();
				
				print("CMD        : " + j);
				print("dV/dt, V/us: " + rate);
				print("Vset,     V: " + VoltageArray[i]);
				print("V,        V: " + v);
				
				cntDone++;
				print("-- result " + cntDone + " of " + cntTotal + " --");
				
				CdVdt_StoreVoltageAndRate(j, rate, VoltageArray[i], v);
				
				if (anykey()) return;
			}
		}
	}
	
	// Power disable
	dev.c(2);
}

function CdVdt_CollectFixedRate(Repeat)
{
	CdVdt_ResetA();
	
	var VoltageArray = CGEN_GetRange(cdvdt_Vmin, cdvdt_Vmax, cdvdt_Vstp);
	
	var cntDone = 0;	
	var cntTotal = VoltageArray.length * cdvdt_RatePoint.length * Repeat;
	
	// Re-enable power
	dev.c(2);
	sleep(1000);
	dev.c(1);
	
	for (var counter = 0; counter < Repeat; counter++)
	{
		for (var k = 0; k < VoltageArray.length; k++)
		{
			dev.w(128, VoltageArray[k]);
			CdVdt_TekVScale(cdvdt_chMeasure, VoltageArray[k]);
			TEK_TriggerInit(cdvdt_chMeasure, VoltageArray[k] / 2);
			
			for (var i = 0; i < cdvdt_RatePoint.length; i++)
			{
				sleep(1000);
				dev.w(129, cdvdt_RatePoint[i])		
				
				CdVdt_TekHScale(cdvdt_chMeasure, VoltageArray[k], cdvdt_RatePoint[i]);
				sleep(500);
				
				CdVdt_ClearDisplay();
				sleep(1000);
				
				// Start pulse
				for(var CounterAverages = 0; CounterAverages < cdvdt_def_UseAverage; CounterAverages++)
				{			
					while(_dVdt_Active()) sleep(50);
					dev.c(100);
					sleep(1000);
				}

				sleep(1500);
				while(_dVdt_Active()) sleep(50);				
				var rate = CdVdt_MeasureRate();
				var v = CdVdt_MeasureVfast();
				
				print("dVdt set,  V/us: " + cdvdt_RatePoint[i]);
				print("dV/dt osc, V/us: " + rate);
				print("Vset,         V: " + VoltageArray[k]);
				print("V osc,        V: " + v);
				
				cntDone++;
				print("-- result " + cntDone + " of " + cntTotal + " --");
				CdVdt_StoreVoltageAndFixRate(cdvdt_RatePoint[i], rate, VoltageArray[k], v);
								
				if (anykey()){ p("Stopped from user!"); return};
			}
		}
	}
	// Power disable
	dev.c(2);
}

function CdVdt_StabCheck(CellNumber, Voltage, Gate)
{
	var Counter = 20;
	
	// Power enable cell
	dVdt_CellCall(CellNumber, 1);
	
	// Configure amplitude
	dVdt_SelectRange(CellNumber, cdvdt_SelectedRange)
	dVdt_CellSetV(CellNumber, Voltage);
	CdVdt_TekVScale(cdvdt_chMeasure, Voltage);
	TEK_TriggerInit(cdvdt_chMeasure, Voltage / 2);
	TEK_Horizontal("1.0e-6", "0");
	
	// Wait for power ready
	while (dVdt_CellReadReg(CellNumber, 14) == 0) sleep(100);
	sleep(1000);
	TEK_ForceTrig();
	
	// Set gate cdvdt_CalVoltage
	dVdt_CellSetGate(CellNumber, Gate);
	sleep(500);
	
	for (var i = 0; i < Counter; i++)
	{
		// Start pulse
		dev.c(114);
		while(_dVdt_Active()) sleep(50);
		sleep(500);
		
		if (anykey())
		{
			dVdt_CellCall(CellNumber, 2);
			return;
		}
	}
	
	dVdt_CellCall(CellNumber, 2);
}

function CdVdt_StoreVoltageAndRate(CMD, RateScope, Voltage, VoltageScope)
{
	var ConfiguredRate, RateErr, RateSet;
	var VoltageErr = ((VoltageScope - Voltage) / Voltage * 100).toFixed(1);
	
	switch (CMD)
	{
		case 101:
			RateSet = 500;
			RateErr = ((RateScope - 500) / 500 * 100).toFixed(1);
			cdvdt_scatter05.push(RateScope + ";" + RateErr + ";" + Voltage + ";" + VoltageScope + ";" + VoltageErr);
			break;
			
		case 102:
			RateSet = 1000;
			RateErr = ((RateScope - 1000) / 1000 * 100).toFixed(1);
			cdvdt_scatter10.push(RateScope + ";" + RateErr + ";" + Voltage + ";" + VoltageScope + ";" + VoltageErr);
			break;
			
		case 103:
			RateSet = 1600;
			RateErr = ((RateScope - 1600) / 1600 * 100).toFixed(1);
			cdvdt_scatter16.push(RateScope + ";" + RateErr + ";" + Voltage + ";" + VoltageScope + ";" + VoltageErr);
			break;
			
		case 104:
			RateSet = 2000;
			RateErr = ((RateScope - 2000) / 2000 * 100).toFixed(1);
			cdvdt_scatter20.push(RateScope + ";" + RateErr + ";" + Voltage + ";" + VoltageScope + ";" + VoltageErr);
			break;
			
		case 105:
			RateSet = 2500;
			RateErr = ((RateScope - 2500) / 2500 * 100).toFixed(1);
			cdvdt_scatter25.push(RateScope + ";" + RateErr + ";" + Voltage + ";" + VoltageScope + ";" + VoltageErr);
			break;
	}
	
	cdvdt_scatter.push(RateSet + ";" + RateScope + ";" + RateErr + ";" + Voltage + ";" + VoltageScope + ";" + VoltageErr);
}

function CdVdt_StoreVoltageAndFixRate(Rate, RateScope, Voltage, VoltageScope)
{
	var ConfiguredRate, RateErr, RateSet;
	var VoltageErr = ((VoltageScope - Voltage) / Voltage * 100).toFixed(1);
	
	RateErr = ((RateScope - Rate) / Rate * 100).toFixed(1);
	cdvdt_scatter05.push(RateScope + ";" + RateErr + ";" + Voltage + ";" + VoltageScope + ";" + VoltageErr);
	
	cdvdt_scatter.push(Rate + ";" + RateScope + ";" + RateErr + ";" + Voltage + ";" + VoltageScope + ";" + VoltageErr);
}

function CdVdt_PrintSetpoints(CellNumber)
{
	print("Selected range code: " + cdvdt_SelectedRange);
	print("-----");
	
	// Base DataTable address
	var BaseDTAddress = cdvdt_def_SetpointStartAddr[cdvdt_SelectedRange] + (CellNumber - 1) * cdvdt_def_SetpointCount * 2;
	
	for (var i = 0; i < cdvdt_def_SetpointCount; i++)
	{
		var reg = BaseDTAddress + i * 2;
		print((i + 1) + "# Vgate,  mV [" + reg + "]: " + dev.r(reg));
		print((i + 1) + "# Rate, V/us [" + (reg + 1) + "]: " + dev.r(reg + 1));
		print("-----");
	}
}

function CdVdt_ResetA()
{
	cdvdt_scatter = [];
	//
	cdvdt_scatter05 = [];
	cdvdt_scatter10 = [];
	cdvdt_scatter16 = [];
	cdvdt_scatter20 = [];
	cdvdt_scatter25 = [];
	//
	cdvdt_realRate = [];
}

function CdVdt_SaveA(Name)
{
	save("data/dvdt_" + Name + ".csv", cdvdt_scatter);
}

function CdVdt_CalRate(K)
{
	dev.w(6, Math.round(K * 1000));
	dev.w(7, 1000);
}

function CdVdt_CalV(K, Offset)
{
	dev.w(0, Math.round(K * 1000));
	dev.w(1, 1000);
	dev.ws(2, Math.round(Offset));
}

function CdVdt_ResetRateCal()
{
	dev.w(3, 0);
	dev.w(5, 0);
	
	CdVdt_CalRate(1);
}

function CdVdt_ResetVCal()
{
	CdVdt_CalV(1, 0);
}

function CdVdt_ClearDisplay()
{
	TEK_AcquireSample();
	if(cdvdt_def_UseAverage > 1)
		TEK_AcquireAvg(cdvdt_def_UseAverage);
	sleep(500);
}

function CdVdt_ResourceTest(Repeat)
{
	CdVdt_ResetA();
	
	var VoltageArray = CGEN_GetRange(cdvdt_Vmin, cdvdt_Vmax, cdvdt_Vstp);
	
	var cntDone = 0;	
	var cntTotal = VoltageArray.length * cdvdt_RatePoint.length * Repeat;
	
	// Re-enable power
	dev.c(2);
	sleep(1000);
	dev.c(1);
	
	for (var counter = 0; counter < Repeat; counter++)
	{
		for (var k = 0; k < VoltageArray.length; k++)
		{
			dev.w(128, VoltageArray[k]);		
			for (var i = 0; i < cdvdt_RatePoint.length; i++)
			{
				sleep(1000);
				dev.w(129, cdvdt_RatePoint[i])		
				sleep(1000);
				
				// Start pulse
				while(_dVdt_Active()) sleep(50);
				dev.c(100);
				sleep(1000);

				while(_dVdt_Active()) sleep(50);				

				print("dVdt set,  V/us: " + cdvdt_RatePoint[i]);
				print("Vset,         V: " + VoltageArray[k]);
				cntDone++;
				print("-- result " + cntDone + " of " + cntTotal + " --");
				if (anykey()){ p("Stopped from user!"); return};
			}
		}
	}
	// Power disable
	dev.c(2);
}