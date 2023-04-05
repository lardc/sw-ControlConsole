function MR_ReadLabel()
{
	MR_Read(331)
}

function MR_Read(Command)
{
	dev.c(Command)
	var OutString = ''
	
	while(true)
	{
		var DataType = MR_GetWord()
		var DataLen = MR_GetWord()
		
		if(0 <= DataType && DataType <= 7 && DataLen != 65535)
		{
			OutString += 'data type: \'' + MR_DataTypeName(DataType) + '\', data len: \'' + DataLen +
				'\', data: \''
			
			for(var i = 0; i < MR_GetWordsToRead(DataType, DataLen); i++)
			{
				var w = MR_GetWord()
				
				if(DataType == 0)
				{
					if((w >> 8) != 0)
						OutString += String.fromCharCode(w >> 8)
					
					if((w & 0xFF) != 0)
						OutString += String.fromCharCode(w & 0xFF)
				}
			}
			OutString += '\'\n'
		}
		else
			break
	}
	p(OutString)
}

function MR_GetWord()
{
	dev.c(330)
	return dev.r(299)
}

function MR_GetWordsToRead(DataType, DataLen)
{
	switch(DataType)
	{
		case 0:
		case 1:
		case 2:
			return DataLen / 2
		
		case 5:
		case 6:
		case 7:
			return DataLen * 2
		
		default:
			return DataLen
	}
}

function MR_DataTypeName(DataType)
{
	switch(DataType)
	{
		case 0:
			return 'char'
		case 1:
			return 'uint8'
		case 2:
			return 'int8'
		case 3:
			return 'uint16'
		case 4:
			return 'int16'
		case 5:
			return 'uint32'
		case 6:
			return 'int32'
		case 7:
			return 'float'
		default:
			return ''
	}
}
