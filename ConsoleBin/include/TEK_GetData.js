include("Tektronix.js")
include("CalGeneral.js")

// Channels
UsePort = 1;

function TEK_GD_Init(Port)
{
	TEK_PortInit(Port, 9600);
	TEK_Send("data:width 1");
	TEK_Send("data:encdg rpb");
	TEK_Send("data:start 1");
	TEK_Send("data:stop 2500");
}

function TEK_Init(PortTek,UsePort)
{

	if (UsePort < 1 || UsePort > 4)
	{
		print("Wrong channel numbers");
		return;
	}

	TEK_GD_Init(PortTek);
	
	// Tektronix init
	for (var i = 1; i <= 4; i++)
	{

		if (i == UsePort)
			TEK_ChannelOn(i);
		else
			TEK_ChannelOff(i);
	}

	
}

function GetChannelData(Channel) 
{

	// read basic data
	var p_scale = TEK_Exec("ch" + Channel + ":scale?");
	var p_position = TEK_Exec("ch" + Channel + ":position?");

	// init data read
	TEK_Send("data:source ch" + Channel);

	// read curve
	var data_input = TEK_Exec("curve?");
	print("Channel " + Channel + " loaded");

	// validate data
	if ((data_input[0] != "#") || (data_input[1] != 4) || (data_input[2] != 2) ||
		(data_input[3] != 5) || (data_input[4] != 0) || (data_input[5] != 0))
	{
		print("Invalid CH" + Channel + " data.");
		return;
	}

	// adjust data
	var res = [];
	for (var i = 6; i < 2506; ++i)
		res[i - 6] = ((data_input[i].charCodeAt(0) - 128 - p_position * 25) * p_scale / 25)*10000;
	
	return res;
}

function SaveChannelData(NameFile, Data)
{
save(cgen_correctionDir + "/" + NameFile + ".csv", Data);
}

function ChannelData(NameFile, Channel)
{
	var Data = [];
	Data = (GetChannelData(Channel));
	SaveChannelData(NameFile, Data);
}
