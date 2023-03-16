include("PrintStatus.js")

function IGTU_Iges(Voltage, CurrentRange)
{
	dev.wf(136, Voltage);
	dev.w(137,CurrentRange);
	dev.c(102);
	
	//p("Start process...")
	
	sleep(dev.r(56) * 30);
	
	while(dev.r(192) != 3)
	{
		//p("Iges, nA:" + (dev.rf(205)*1e6).toFixed(2));
	}
}

IGES = [];
function IGES_Collect(N)
{
	Iges = 0;
	Imin = 0;
	Imax = 0;
	Imean = 0;
	Ipp = 0;
	
	Noise = 0;
	IGES = [];
	
	for(i = 0; i < N; i++)
	{
		p("#" + i);
		
		IGTU_Iges(4.7, 1);
		
		Iges = (dev.rf(205)*1e6).toFixed(2);
		Imean += Math.pow(Iges, 2);
		
		if(Imin == 0)
			Imin = Iges;
		if(Imax == 0)
			Imax = Iges;
		if(Iges < Imin)
			Imin = Iges;
		if(Iges > Imax)
			Imax = Iges;
		
		IGES.push(Iges)
	}
	
	Imean = Math.sqrt(Imean / N);
	Ipp = Imax - Imin;
	
	
	Noise = 20 * Math.log(Imean / Ipp) / Math.log(10);
	
	p("Ip-p,  nA: " + Ipp)
	p("Imean, nA: " + Imean)
	p("Noise, db: " + Noise)
	pl(IGES);
}