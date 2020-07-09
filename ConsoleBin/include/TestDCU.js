function DRCU_Pulse(RiseRate, FallRate, Amplitude, Range)
{
	switch (Range)
	{
		case 0:
		{
			dev.c(18);
			break;
		}
		case 1:
		{
			dev.c(19);
			break;
		}
		case 2:
		{
			dev.c(20);
			break;
		}
	}
	
	dev.w(0,RiseRate);
	dev.c(15);
	dev.w(0,FallRate);
	dev.c(14);
	dev.w(0,Amplitude);
	dev.c(16);
	
	sleep(100);
	dev.c(21);
	sleep(1);
	dev.c(17);
	
	sleep(10);
	dev.c(22);
	
	// Reset to default
	dev.w(0,1000);
	dev.c(14);
	dev.w(0,0);
	dev.c(16);
	dev.w(0,0);
	dev.c(15);
	
	sleep(1000);
}