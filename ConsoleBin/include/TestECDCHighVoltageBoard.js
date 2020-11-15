include("PrintStatus.js")
include("Common.js")

ECDC_HV_print = 1;

function ECDC_HV_Measure(Voltage, Current)
{
	if(dev.r(192) == 3)
	{
		dev.w(128, Voltage);
		w32(129, Current);
		
		dev.c(100);
		
		//sleep(3000);
		
		while(dev.r(192) == 4){sleep(50);}
		
		if(dev.r(192) == 1)
			PrintStatus();
		
		if(ECDC_HV_print)
		{
			p("");
			p("Voltage,  V: " + (dev.r(200) / 10));
			p("Current, uA: " + (r32(201) / 10));
			p("------------");
		}
	}
	else
	{
		if(dev.r(192) != 1)
			print("Device not ready");
		else
			PrintStatus();
	}
}
//--------------------
