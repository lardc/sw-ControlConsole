include("PrintStatus.js")

function Zth_Im(Current, PulseWidth_us)
{
	var PulseWidth_L, PulseWidth_H;
	var Sleep;
	
	Sleep = PulseWidth_us / 1e6;
	if(Sleep < 1)
		Sleep = 1;
	
	PulseWidth_L = PulseWidth_us & 0xFFFF;
	PulseWidth_H = (PulseWidth_us >> 16) & 0xFFFF;
	
	dev.w(135, PulseWidth_L);
	dev.w(136, PulseWidth_H);
	dev.w(139, Current);
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

function Zth_Gate(Type, Value, State)
{	
	dev.w(129, Type);
	
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
	
	PulseWidth_L = PulseWidth_us & 0xFFFF;
	PulseWidth_H = (PulseWidth_us >> 16) & 0xFFFF;
	
	dev.w(135, PulseWidth_L);
	dev.w(136, PulseWidth_H);
	dev.w(139, Current);
	dev.w(128, 5);
	dev.c(51);
	p("Process...");
	
	for(i = 0; i < Sleep; i++)
	{
		sleep(1000);
		p("#" + i + " Ih, A: " + dev.r(201) / 10);
		
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