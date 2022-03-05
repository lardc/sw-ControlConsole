include("PrintStatus.js")

function CSM_Pos(Distance)
{
	dev.w(64, Distance)
	dev.c(101)
	do
	{
		if(anykey())
			return
		sleep(100)
	}
	while(dev.r(96) == 6)
	
	if(dev.r(96) != 3)
	{
		print("Bad status")
		PrintStatus()
	}
}