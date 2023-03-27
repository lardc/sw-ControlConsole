include("PrintStatus.js")

function IGTU_Iges(Voltage, CurrentRange)
{
	dev.wf(136, Voltage);
	dev.w(137,CurrentRange);
	dev.c(102);
	
	p("Start process...")
	
	sleep(dev.r(56) * 30);
	
	while(dev.r(192) != 3)
	{
		if(dev.r(192) == 1)
		{
			PrintStatus();
			return;
		}
	}
	
	if(dev.r(196) != 0)
		PrintStatus();
	
	p("Iges, nA:" + (dev.rf(205)*1e6).toFixed(2));
}
//--------------------

function IGTU_Vgs(Voltage, Current)
{
	dev.wf(128, Current);
	dev.wf(129, Voltage);
	dev.c(100);
	
	sleep(100);
	
	if(dev.r(192) == 3 && !dev.r(196))
	{
		p("Vgs, V:" + dev.rf(200).toFixed(4));
		p("Igs, mA:" + dev.rf(201).toFixed(2));
	}
	else
		PrintStatus();
}
//--------------------