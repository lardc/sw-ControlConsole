include("PrintStatus.js")

function LSLPC_Start(Current)
{
	dev.w(128, Current * 10);
	dev.c(100);
	
	while(dev.r(192) != 4)
	{
		sleep(50);
		
		if(dev.r(192) == 1)
		{
			PrintStatus();
			return false;
		}
	}
	
	dev.c(101);
	
	sleep(20);
	
	while(dev.r(192) != 3)
	{
		sleep(50);
		
		if(dev.r(192) == 1)
		{
			PrintStatus();
			return false;
		}
	}
	
	return true;
}
//--------------------------

function LSLPC_Pulses(Current, N)
{
	for(i = 0; i < N; i++)
	{
		print("#" + i);
		LSLPC_Start(Current);
		
		if(anykey())
			break;
	}
}
//--------------------------




