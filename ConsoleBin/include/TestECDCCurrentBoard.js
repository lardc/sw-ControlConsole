include("PrintStatus.js")

var ECDC_CB_Print = 1;

function ECDC_CB_Measure(Current, Voltage)
{
	if(dev.r(192) == 3)
	{
		w32(128, Current);
		dev.w(130, Voltage);
		
		dev.c(100);
		
		while(dev.r(192) == 4){sleep(10);}
		
		if(dev.r(192) == 3)
		{
			if(ECDC_CB_Print)
			{
				print("DUT Current, mA: " + r32(250));
				print("DUT Voltage, mV: " + dev.r(252));
				print("---------------");
				print("");
			}
		}
		
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

function w32(Address, Value)
{
	dev.w(Address,(Value & 0xffff));
	dev.w((Address + 1),((Value >> 16) & 0xffff));
}
//--------------------

function r32(Address)
{
	var ReadValue;
	
	ReadValue = dev.r(Address);
	ReadValue |= (dev.r(Address + 1) << 16);
	
	return ReadValue;
}
//--------------------