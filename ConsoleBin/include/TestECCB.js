include("PrintStatus.js")

function ECCB_ReadReg(NodeID, Reg)
{
	dev.w(185, NodeID)
	dev.w(186, Reg)
	dev.c(10)
	
	if (dev.r(230) == 0)
		return dev.r(231)
	else
	{
		print("Err code: " + dev.r(230))
		return 0
	}
}

function ECCB_ReadRegS(NodeID, Reg)
{
	dev.w(185, NodeID)
	dev.w(186, Reg)
	dev.c(10)
	
	if (dev.r(230) == 0)
		return dev.rs(231)
	else
	{
		print("Err code: " + dev.r(230))
		return 0
	}
}

function ECCB_WriteReg(NodeID, Reg, Value)
{
	dev.w(185, NodeID)
	dev.w(186, Reg)
	dev.w(187, Value)
	dev.c(11)
	
	if (dev.r(230) != 0)
		print("Err code: " + dev.r(230))
}

function ECCB_WriteRegS(NodeID, Reg, Value)
{
	dev.w(185, NodeID)
	dev.w(186, Reg)
	dev.ws(187, Value)
	dev.c(11)
	
	if (dev.r(230) != 0)
		print("Err code: " + dev.r(230))
}

function ECCB_Call(NodeID, Action)
{
	dev.w(185, NodeID)
	dev.w(186, Action)
	dev.c(12)
	
	if (dev.r(230) != 0)
		print("Err code: " + dev.r(230))
}

function ECCB_ReadArray(NodeID, EndPoint)
{
	dev.w(185, NodeID)
	dev.w(186, EndPoint)
	dev.c(13)
	
	if (dev.r(230) != 0)
		print("Err code: " + dev.r(230))
}

function ECCB_Status()
{
	print("Device state:		" + dev.r(192))
	print("Device substate:	" + dev.r(220))
	print("Config err code:	" + dev.r(221))
	print("[Interface status]")
	print("Device: 		" + dev.r(226))
	print("Function: 		" + dev.r(227))
	print("Error: 			" + dev.r(225))
	print("ExtData:		" + dev.r(228))
}

function ECCB_Plot(Node, EndPoint)
{
	ECCB_ReadArray(Node, EndPoint)
	plot(dev.rafs(1), 1, 0)
}
