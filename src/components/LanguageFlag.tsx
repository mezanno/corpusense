import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const FrFlag = () => {
  return (
    <div>
      <svg width={24} height={24} fill='none' viewBox='0 0 24 24'>
        <g clipPath='url(#FR_svg__a)'>
          <path
            d='M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Z'
            fill='#F0F0F0'
          />
          <path
            d='M24 12c0-5.16-3.257-9.558-7.826-11.254v22.508C20.744 21.558 24 17.159 24 12Z'
            fill='#D80027'
          />
          <path
            d='M0 12c0 5.16 3.257 9.559 7.826 11.254V.747C3.256 2.443 0 6.841 0 12.001Z'
            fill='#0052B4'
          />
        </g>
        <defs>
          <clipPath id='FR_svg__a'>
            <path fill='#fff' d='M0 0h24v24H0z' />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
};

const EnFlag = () => {
  return (
    <div>
      <svg width={24} height={24} fill='none' viewBox='0 0 24 24'>
        <g clipPath='url(#GB_svg__a)'>
          <path
            d='M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Z'
            fill='#F0F0F0'
          />
          <path
            d='M2.48 4.693A11.956 11.956 0 0 0 .413 8.868h6.243L2.48 4.693Zm21.106 4.176a11.957 11.957 0 0 0-2.067-4.176L17.344 8.87h6.242ZM.413 15.13a11.957 11.957 0 0 0 2.067 4.176l4.176-4.176H.413ZM19.305 2.48A11.957 11.957 0 0 0 15.13.412v6.243l4.175-4.175ZM4.693 21.518a11.957 11.957 0 0 0 4.176 2.067v-6.243l-4.176 4.176ZM8.869.412A11.957 11.957 0 0 0 4.693 2.48L8.87 6.655V.412Zm6.261 23.173a11.96 11.96 0 0 0 4.175-2.067l-4.175-4.176v6.243Zm2.214-8.455 4.175 4.176a11.957 11.957 0 0 0 2.067-4.176h-6.242Z'
            fill='#0052B4'
          />
          <path
            d='M23.898 10.435H13.565V.102a12.12 12.12 0 0 0-3.13 0v10.333H.102a12.12 12.12 0 0 0 0 3.13h10.333v10.333a12.12 12.12 0 0 0 3.13 0V13.565h10.333a12.12 12.12 0 0 0 0-3.13Z'
            fill='#D80027'
          />
          <path
            d='m15.13 15.131 5.356 5.355c.246-.246.48-.503.705-.77l-4.584-4.585H15.13Zm-6.26 0-5.355 5.355c.246.246.503.481.77.705l4.585-4.584V15.13Zm0-6.261v-.001L3.515 3.514a12.03 12.03 0 0 0-.705.77L7.394 8.87H8.87Zm6.26 0 5.356-5.355a12.023 12.023 0 0 0-.77-.705L15.13 7.394V8.87Z'
            fill='#D80027'
          />
        </g>
        <defs>
          <clipPath id='GB_svg__a'>
            <path fill='#fff' d='M0 0h24v24H0z' />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
};

const LanguageFlag = () => {
  const { i18n } = useTranslation();

  return (
    <Select
      defaultValue={i18n.language.substring(0, 2)}
      onValueChange={(value) => void i18n.changeLanguage(value)}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='fr'>
          <FrFlag />
        </SelectItem>
        <SelectItem value='en'>
          <EnFlag />
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default LanguageFlag;
