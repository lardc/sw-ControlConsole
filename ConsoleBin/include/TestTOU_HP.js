include("PrintStatus.js")

// Global definitions
GateCurrentRate = 60;
GateCurrent = 60;
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
			print("DeviceState   	  = "+dev.r(192));
			print("FaultReason   	  = "+dev.r(193));
			print("Warning       	  = "+dev.r(195));
			print("Problem       	  = "+dev.r(196));
			break;
		}		
		
		sleep(PulseToPulseDelay);
		
		if(anykey())
			break;
	}
}

function TOUHP_Measure(Voltage, Current)
{
	dev.w(128, Voltage);
	dev.w(129, Current);
	dev.w(130, GateCurrent);
	dev.w(131, GateCurrentRate);
	
	while(dev.r(192) != 3){}
	
	dev.c(100);
	
	sleep(10);
	
	while(dev.r(192) == 4){sleep(50);}
	
	if(tou_print)
	{
		print("Turn on, ns       = " + dev.r(252));
		print("Turn on delay, ns = " + dev.r(251));
		print("--------------");
	}
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
function GD_Pulse(Rise, Fall, Imax)
{
	dev.w(190,1);
	dev.c(15);
	dev.c(18);
	dev.c(19);
	
	dev.w(190,Imax);
	dev.c(10);
	
	dev.w(190,Rise);
	dev.c(12);
	
	dev.w(190,Fall);
	dev.c(13);
	
	dev.w(190,(Imax * 0.1));
	dev.c(11);
	
	sleep(10);
	
	dev.w(190,0);
	dev.c(15);
	sleep(100);
	
	dev.c(14);
	
	dev.w(190,1);
	dev.c(15);
}