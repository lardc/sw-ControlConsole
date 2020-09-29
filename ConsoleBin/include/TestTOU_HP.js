include("PrintStatus.js")

// Global definitions
GateCurrentRate = 10000;
GateCurrent = 2000;
//
tou_print = 1;
PulseToPulseDelay = 2000;
//

// TOU HP
function TOUHP_Start(N, Voltage, Current)
{
	for(i = 0; i < N; i++)
	{
		print("#" + i);
		
		TOUHP_Measure(Voltage, Current);

		if(dev.r(193) || dev.r(196))
		{
			TOUHP_PrintFault();
			break;
		}
		
		sleep(PulseToPulseDelay);
		
		if(anykey())
			break;
	}
}

function TOU_Run(Voltage, Current)
{
	dev.nid(1);
	dev.c(115);
	
	dev.nid(11);
	TOUHP_Measure(Voltage, Current * 10)
	
	dev.nid(1);
	dev.c(110);
}

function TOUHP_Measure(Voltage, Current)
{
	while(dev.r(192) != 3)
	{
		sleep(50);
		
		if(dev.r(192) == 1)
			return;
	}
		
	dev.w(128, Voltage);
	dev.w(129, Current);
	dev.w(130, GateCurrent);
	dev.w(131, GateCurrentRate);
	
	dev.c(100);
	while(dev.r(192) == 4);
	
	if(tou_print)
	{
		print("tgd,  ns: " + dev.r(251));
		print("tgt,  ns: " + dev.r(252));
		print("--------------");
	}
}

function TOUHP_PrintFault()
{
	print("DeviceState   	  = "+dev.r(192));
	print("FaultReason   	  = "+dev.r(193));
	print("Warning       	  = "+dev.r(195));
	print("Problem       	  = "+dev.r(196));
}

// TOCU HP
function TOCUHP_Pulse(N, Voltage, Bit)
{
	dev.w(128, Voltage);
	dev.w(129, Bit);
	
	if(dev.r(192) == 3)
		dev.c(100);
	
	for(i=0; i < N; i++)
	{
		while(dev.r(192) == 4){}
		
		if(dev.r(192) == 3)
		{
			dev.c(101);
			dev.c(102);
		}
		
		print("N          = " + i)
		print("Voltage, V = " + dev.r(200));
		print("-----------");
	}
}

// TOMU HP
function TOMUHP_GatePulse(GateCurrentRate, GateCurrent)
{
	dev.w(190,1);
	dev.c(18);
	dev.c(19);
	
	dev.w(130, GateCurrent);
	dev.w(131, GateCurrentRate);
	
	dev.c(110);
}

function TOMU_CommutationControl(Control)
{
	if(Control)
	{
		dev.w(14,0);
		dev.w(190,0);
		dev.c(21);
		dev.c(22);
	}
	else
		dev.w(14,1);
}