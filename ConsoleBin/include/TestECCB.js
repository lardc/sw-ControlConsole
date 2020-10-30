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

function ECCB_ReadReg32d(NodeID, RegL, RegH)
{
	var result = 0
	
	dev.w(185, NodeID)
	dev.w(186, RegL)
	dev.c(10)
	
	if (dev.r(230) == 0)
	{
		result |= dev.r(231)
	}
	else
	{
		print('Read low part error.')
		print("Err code: " + dev.r(230))
		return
	}
	
	dev.w(186, RegH)
	dev.c(10)
	
	if (dev.r(230) == 0)
	{
		result |= dev.r(231) << 16
	}
	else
	{
		print('Read high part error.')
		print("Err code: " + dev.r(230))
	}
	
	return result
}

function ECCB_ReadReg32(NodeID, RegL)
{
	return ECCB_ReadReg32d(NodeID, RegL, RegL + 1)
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

function ECCB_WriteReg32d(NodeID, RegL, RegH, Value)
{
	dev.w(185, NodeID)
	dev.w(186, RegL)
	dev.w(187, Value & 0xffff)
	dev.c(11)
	
	if (dev.r(230) != 0)
	{
		print('Write low part error.')
		print("Err code: " + dev.r(230))
		return
	}
	
	dev.w(186, RegH)
	dev.w(187, (Value >> 16) & 0xffff)
	dev.c(11)
	
	if (dev.r(230) != 0)
	{
		print('Write high part error.')
		print("Err code: " + dev.r(230))
	}
}

function ECCB_WriteReg32(NodeID, RegL, Value)
{
	ECCB_WriteReg32d(NodeID, RegL, RegL + 1, Value)
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

function ECCB_NodeStatus(Node)
{
	print("Registers [192 - 197]");
	print("Device state:	" + ECCB_ReadReg(Node, 192));
	print("Fault reason:	" + ECCB_ReadReg(Node, 193));
	print("Disable reason:	" + ECCB_ReadReg(Node, 194));
	print("Warning:	" + ECCB_ReadReg(Node, 195));
	print("Problem:	" + ECCB_ReadReg(Node, 196));
	print("OpResult:	" + ECCB_ReadReg(Node, 197))
	print("Sub state:	" + ECCB_ReadReg(Node, 198))
}

function ECCB_Plot(Node, EndPoint)
{
	ECCB_ReadArray(Node, EndPoint)
	plot(dev.rafs(1), 1, 0)
}
