include("PrintStatus.js")
include("Common.js")

function ECDC_HV_CalCell(Voltage, CellNumder)
{
	if(dev.r(192) == 3)
	{
		dev.w(128, Voltage);
		dev.w(151, CellNumder);
		
		dev.c(150);
		
		sleep(1000);
		
		if(dev.r(192) == 1)
			PrintStatus();
	}
	else
	{
		if(dev.r(192) != 1)
			print("Device not ready");
		else
			PrintStatus();
	}
}

function ECDC_HV_Measure(Voltage, Current)
{
	if(dev.r(192) == 3)
	{
		dev.w(128, Voltage);
		w32(129, Voltage);
		
		dev.c(100);
		
		while(dev.r(192) == 4){sleep(10);}
		
		if(dev.r(192) == 1)
			PrintStatus();
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
