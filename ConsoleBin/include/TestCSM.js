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
function CSM_PosAdap (DeviceCase)

{
	dev.w(71,DeviceCase);
	dev.c(110);
	sleep(1000);
	dev.c(102);
	do
	{
		if(anykey())
			return
		sleep(100)
	}
	while(dev.r(96) == 7)
	
	if(dev.r(96) != 8)
	{
		print("Bad status")
		PrintStatus()
	}
}

function CSM_UNClamp ()

{
	dev.c(120);
	sleep(1000);
	dev.c(109);
	sleep(100);

}
