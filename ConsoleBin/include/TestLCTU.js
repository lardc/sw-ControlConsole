include("PrintStatus.js")

function LCTU_Start(Voltage, PulseWidth)
{
	if(dev.r(192) == 3)
	{
		dev.w(128, Voltage);
		dev.w(129, PulseWidth);
		dev.c(100);
		
		sleep(50);
		
		while(dev.r(192) == 4)
		{
			if(anykey())
				break;
			
			sleep(100);
		}
		
		if(!dev.r(192) == 3)
		{
			PrintStatus();
			return 0;
		}
	}
	else
	{
		PrintStatus();
		return 0;
	}
	
	return 1;
}
//-----------------------------

function LCTU_StartSeq(N)
{
	for(i = 0; i < N; i++)
	{
		if(!LCTU_Start(1500, 100))
			return;
		
		p("#" + i);
	}
}
//-----------------------------

function LCTU_TestOpAmp(Voltage)
{
	// Voltage содержит значения в диапазоне ЦАП (0 - 4095)	
	dev.w(150, Voltage);
	dev.c(50);
	dev.c(51);
	sleep(100);
	dev.w(150, 0);
	dev.c(51);
}
//-----------------------------

function LCTU_Format(FileName)
{
	var Min = 0, Max = 0, Mean = 0, ErrSet = 0, Errmin = 0, Errmax = 0;
	ReadData = [];
	
	ReadData = load("LCTU_data/" + FileName + ".csv");
	
	for(i = 0; i < 20000; i++)
	{
		if(ReadData[i] > 2000)
			ReadData[i] = ReadData[i-1];
	}
	
	for(i = 20000; i < 95000; i++)
	{
		if(ReadData[i] > Max)
			Max = parseFloat(ReadData[i]);
		
		if(ReadData[i] < Min || !Min)
			Min = parseFloat(ReadData[i]);
		
		Mean += (parseFloat(ReadData[i]) / 75000);
	}
	
	ErrSet = ((Mean - 1000) / 1000 * 100).toFixed(2);
	Errmin = ((Min - Mean) / Mean * 100).toFixed(2);
	Errmax = ((Max - Mean) / Mean * 100).toFixed(2);
	
	if(Errmin > Errmax)
		Errmax = Errmin;
	
	p("V min,  V: " + Min.toFixed(2));
	p("V max,  V: " + Max.toFixed(2));
	p("V mean, V: " + Mean.toFixed(2));
	p("ErrSet, %: " + ErrSet);
	p("dV err, %: " + Errmax);	
	
	pl(ReadData);
}