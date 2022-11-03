include("TestFCROVU.js")
include("Tektronix.js")

cfdvdt_chMeasure = 1;

cfdvdt_def_VGateMin = 3000;
cfdvdt_def_VGateMax = 5000;
cfdvdt_def_SetpointCount = 10;

cfdvdt_CalVoltage = 500;

cfdvdt_HVProbeScale = "100"	// Коэффициент деления щупа

// Use averages in OSC
cfdvdt_NO_AVERAGES = 1;
cfdvdt_AVERAGES_4 = 4;
cfdvdt_AVERAGES_16 = 16;
cfdvdt_def_UseAverage = cfdvdt_AVERAGES_4;

function CfdVdt_Init(portfdVdt, portTek, channelMeasure)
{
	if (channelMeasure < 1 || channelMeasure > 4)
	{
		print("Wrong channel numbers");
		return;
	}
	
	// Copy channel information
	cfdvdt_chMeasure = channelMeasure;
	
	// Init fdVdt
	dev.Disconnect();
	dev.Connect(portfdVdt);
	
	// Init Tektronix
	TEK_PortInit(portTek);
	
	// Tektronix init
	// Init channels
	CfdVdt_ChannelInit(channelMeasure, cfdvdt_HVProbeScale, "10");
	// Init trigger
	TEK_TriggerInit(channelMeasure, "10");
	// Horizontal settings
	TEK_Horizontal("25e-6", "0");
	
	// Display channels
	for (var i = 1; i <= 4; i++)
	{
		if (i == cfdvdt_chMeasure)
			TEK_ChannelOn(i);
		else
			TEK_ChannelOff(i);
	}
	
	// Init measurement
	CfdVdt_TekMeasurement(channelMeasure);
}

function CfdVdt_CalibrateRate()
{
	var GateSetpointV = CGEN_GetRange(cfdvdt_def_VGateMin, cfdvdt_def_VGateMax, Math.round((cfdvdt_def_VGateMax - cfdvdt_def_VGateMin) / (cfdvdt_def_SetpointCount - 1)));


	CfdVdt_TekVScale(cfdvdt_chMeasure, cfdvdt_CalVoltage);
	TEK_TriggerInit(cfdvdt_chMeasure, cfdvdt_CalVoltage / 2);
	
	for (var i = 0; i < GateSetpointV.length; i++)
	{
		// Force triggering
		TEK_ForceTrig();
		
		// Coarse horizontal setting
		if (i == 0)
		{ 
			TEK_Horizontal("2.5e-6", "0");
			sleep(500);
		}

		// Start pulse
		fdVdt_DiagPulse(GateSetpointV[i]);
		
		// Fine horizontal setting
		CfdVdt_TekHScale(cfdvdt_CalVoltage, CfdVdt_MeasureRate());
		sleep(500);
		
		CfdVdt_ClearDisplay();
		
		// Start pulse
		for(var CounterAverages = 0; CounterAverages < cfdvdt_def_UseAverage; CounterAverages++)
		{
			fdVdt_DiagPulse(GateSetpointV[i]);
			sleep(2000);
		}
		
		var v = CfdVdt_MeasureVfast();
		var rate = CfdVdt_MeasureRate();

		print("Vgt,     mV: " + GateSetpointV[i]);
		print("dV/dt, V/us: " + rate);
		print("Vmax,     V: " + v);
		print("-- result " + (i + 1) + " of " + GateSetpointV.length + " --");
		
		if (anykey()) return 1;
	}
	return 0;
}

function CfdVdt_ClearDisplay()
{
	TEK_AcquireSample();
	if(cfdvdt_def_UseAverage > 1)
		TEK_AcquireAvg(cfdvdt_def_UseAverage);
	sleep(500);
}

function CfdVdt_MeasureRate()
{
	return (TEK_Measure(cfdvdt_chMeasure) * 0.8 / TEK_Exec("measurement:meas2:value?") * 1e-6).toFixed(2);
}

function CfdVdt_MeasureVfast()
{
	return parseFloat(TEK_Measure(cfdvdt_chMeasure)).toFixed(2);
}

function CfdVdt_TekVScale(Channel, Voltage)
{
	// 0.8 - use 80% of full range
	// 8 - number of scope grids in full scale
	var scale = (Voltage / (8 * 0.8));
	TEK_Send("ch" + Channel + ":scale " + scale);
}

function CfdVdt_TekHScale(Voltage, Rate)
{
	var RiseTime = (Voltage / Rate) * 1e-6;
	HScale = (RiseTime / 10) * 6;
	TEK_Horizontal(HScale.toExponential(), "0");
}

function CfdVdt_ChannelInit(Channel, Probe, Scale)
{
	TEK_Send("ch" + Channel + ":bandwidth on");
	TEK_Send("ch" + Channel + ":coupling ac");
	TEK_Send("ch" + Channel + ":invert off");
	TEK_Send("ch" + Channel + ":position -4");
	TEK_Send("ch" + Channel + ":probe " + Probe);
	TEK_Send("ch" + Channel + ":scale " + Scale);
}

function CfdVdt_TekMeasurement(Channel)
{
	TEK_Send("measurement:meas1:source ch" + Channel);
	TEK_Send("measurement:meas1:type maximum");
	TEK_Send("measurement:meas2:source ch" + Channel);
	TEK_Send("measurement:meas2:type rise");
	TEK_Send("measurement:meas3:source ch" + Channel);
	TEK_Send("measurement:meas3:type pk2pk");
}