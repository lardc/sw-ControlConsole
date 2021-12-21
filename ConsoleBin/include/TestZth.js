include("PrintStatus.js")
include("Sic_GetData.js")
include("Tektronix.js")

var Zth_chMeasureI, Zth_chMeasureU;

function Zth_Im(Current, PulseWidth_us)
{
	var PulseWidth_L, PulseWidth_H;
	var Sleep;
	
	Sleep = PulseWidth_us / 1e6;
	if(Sleep < 1)
		Sleep = 1;
	
	PulseWidth_L = PulseWidth_us & 0xFFFF;
	PulseWidth_H = (PulseWidth_us >> 16) & 0xFFFF;
	
	dev.w(132, PulseWidth_L);
	dev.w(133, PulseWidth_H);
	dev.w(140, Current);
	dev.w(128, 4);
	dev.c(50);
	p("Process...");
	
	for(i = 0; i < Sleep; i++)
	{
		sleep(1000);
		p("Im, mA: " + dev.r(203) / 10);
		
		if(anykey())
		{
			dev.c(101);
			return;
		}
		
		if(dev.r(192) != 5)
			return;
	}
}
//------------------------------

function Zth_Gate(DUT_Type, Value, State)
{	
	dev.w(129, DUT_Type);
	
	if(Type)
	{
		if(Value)
			dev.w(143, 1);
		else
			dev.w(143, 0);
	}
	else
		dev.w(139, Value);

	if(State)
		dev.c(52);
	else
		dev.c(101);
}
//------------------------------

function Zth_Ih(Current, PulseWidth_us)
{
	var PulseWidth_L, PulseWidth_H;
	var Sleep;
	
	Sleep = PulseWidth_us / 1e6;
	if(Sleep < 1)
		Sleep = 1;
	
	if(PulseWidth_us <= 2000)
		dev.w(136, Current);
	else
		if(PulseWidth_us > 10000)
			dev.w(138, Current);
		else
			dev.w(137, Current);
		
	PulseWidth_us = PulseWidth_us / 100;
	
	PulseWidth_L = PulseWidth_us & 0xFFFF;
	PulseWidth_H = (PulseWidth_us >> 16) & 0xFFFF;
	
	dev.w(132, PulseWidth_L);
	dev.w(133, PulseWidth_H);
	
	dev.w(128, 5);
	dev.c(51);
	p("Process...");
	
	for(i = 0; i < Sleep; i++)
	{
		sleep(1000);
		
		var ActualPower = dev.r(202) + dev.r(203) / 100;
		var ActualPowerTarget = dev.r(204) + dev.r(205) / 100;
		
		p("#" + i);
		p("U,  V: " + dev.r(200) / 10000);
		p("I,  A: " + dev.r(201) / 10);
		p("P,  W: " + ActualPower);
		p("Pt, W: " + ActualPowerTarget);
		p("----------------");
		p("");
		
		if(anykey())
		{
			dev.c(101);
			return;
		}
		
		if(dev.r(192) != 5)
			return;
	}
}
//------------------------------

function Zth_DRCU_Pulse(Current)
{
	dev.w(128, Current);
	
	if(dev.r(192) == 4)
	{
		dev.c(100);
		
		while(dev.r(192) != 4)
		{
			if(dev.r(192) == 1)
			{
				PrintStatus();
				return 0;
			}
		}
		
		dev.c(101);
	}
}
//------------------------------

function Zth_DRCU_DebugPulse(RiseEdge, FallEdge, IntPsVoltage)
{
	dev.w(129, IntPsVoltage * 10);
	dev.w(150, RiseEdge);
	dev.w(151, FallEdge);
	dev.c(55);
}
//------------------------------

function Zth_DRCU_ReadReg(Address)
{
	dev.w(160, Address);
	dev.c(150);
	
	return(dev.r(161));
}
//------------------------------

function Zth_DRCU_WriteReg(Address, Data)
{
	dev.w(160, Address);
	dev.w(161, Data);
	dev.c(151);
}
//------------------------------

function Zth_DRCU_Call(Command)
{
	dev.w(160, Command);
	dev.c(152);
}
//------------------------------

function CAL_Init(portDevice, portTek, channelMeasureI, channelMeasureU)
{
	if (channelMeasureI < 1 || channelMeasureI > 4 || channelMeasureU < 1 || channelMeasureU > 4)
	{
		print("Wrong channel numbers");
		return;
	}

	// Copy channel information
	Zth_chMeasureI = channelMeasureI;
	Zth_chMeasureU = channelMeasureU;

	// Init device port
	dev.Disconnect();
	dev.Connect(portDevice);

	// Init Tektronix port
	TEK_PortInit(portTek);
	
	// Tektronix init
	for (var i = 1; i <= 4; i++)
	{
		if (i == channelMeasureI || i == channelMeasureU)
			TEK_ChannelOn(i);
		else
			TEK_ChannelOff(i);
	}
}
//--------------------

function Zth_TestPulseSquareness(Current, PulseWidth)
{
	var CurrentWaveform = [];
	var VoltageWaveform = [];
	var PowerWaveform = [];
	var PowerWaveformRef = [];
	var Error, RefPowerPulse, ZthPowerPulse, AvgVoltageDUT, AvgCounter;
	var StartIndex, StopIndex, TimeCounter;
	
	ZthPowerPulse = 0;
	AvgVoltageDUT = 0;
	AvgCounter = 0;
	TimeCounter = 0;
	StartIndex = 0;
	
	// Generate pulse
	Zth_Ih(Current, PulseWidth);
	
	// Load waveform from scope
	CurrentWaveform = SiC_GD_Filter(SiC_GD_GetChannelCurve(Zth_chMeasureI), 1000);
	VoltageWaveform = SiC_GD_Filter(SiC_GD_GetChannelCurve(Zth_chMeasureU), 1);
	
	// Calculate power dissapation
	for(i = 0; i < CurrentWaveform.length; i++)
	{
		PowerWaveform[i] = CurrentWaveform[i] * VoltageWaveform[i];
		
		if(PowerWaveform[i] < 0)
			PowerWaveform[i] = PowerWaveform[i] * (-1);
	}
	
	// Pulse integration
	for(i = 0; i < PowerWaveform.length; i++)
	{
		if((PowerWaveform[i]) > (PowerWaveform[0] * 3))
		{
			ZthPowerPulse += Math.floor(PowerWaveform[i]);
			
			if(!StartIndex)
				StartIndex = i;
			StopIndex = i;
			
			TimeCounter++;
		}
	}
	
	// Voltage averaging 
	for(i = StopIndex - 200; i < StopIndex - 100; i++)
	{
		AvgVoltageDUT += VoltageWaveform[i];
		AvgCounter++;
	}
	AvgVoltageDUT = AvgVoltageDUT / AvgCounter;
	
	
	for(i = 0; i < PowerWaveform.length; i++)
	{
		if((i >= StartIndex) && (i <= StopIndex))
			PowerWaveformRef[i] = Math.floor(AvgVoltageDUT * Current);
		else
			PowerWaveformRef[i] = 0;
	}
	
	RefPowerPulse = Math.floor(AvgVoltageDUT * Current * TimeCounter);
	Error = ((ZthPowerPulse - RefPowerPulse) / RefPowerPulse * 100).toFixed(2);
	
	p("");
	p("");
	p("RefPowerPulse : " + RefPowerPulse);
	p("ZthPowerPulse : " + ZthPowerPulse);
	p("Error         : " + Error);
	p("--------------------------------");
	p("");
	p("");
	plot2(PowerWaveform, PowerWaveformRef, 1, 0)
}
//------------------------------