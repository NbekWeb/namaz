'use client';

import React, {useEffect, useState,useRef} from 'react';
import asr from '../pic/asr-1.png';
import asr2 from '../pic/asr-2.png';
import fadjr from '../pic/fadjr-1.png';
import fadjr2 from '../pic/fadjr-2.png';
import isha from '../pic/isha-1.png';
import isha2 from '../pic/isha-2.png';
import magrib from '../pic/magrib-1.png';
import magrib2 from '../pic/magrib-2.png';
import shuruk from '../pic/shuruk-1.png';
import shuruk2 from '../pic/shuruk-2.png';
import zuhr from '../pic/zuhr-1.png';
import zuhr1 from '../pic/zuhr-2.png';
import woman from '../pic/woman.png';
import phone from '../pic/phone.png';

import qr from '../pic/qr.png';
import Image, {StaticImageData} from 'next/image';
import zuhr2 from "@/pic/zuhr-2.png";
import axios from "axios";
import moment from 'moment-hijri';
import namesOfAllah from "@/namesOfAllah/namesOfAllah";
import {API_BASE_URL} from '@/config/config'

type PrayerTimeProps = {
    time: string;
    label: string;
    highlight?: boolean;
    pic: StaticImageData;
    pic2: StaticImageData;
    remainingTime: number;
    progress: number;
};

interface PrayerTimes {
    fajr: string;
    shuruk: string;
    zuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
}

interface PrayerResponse {
    id: number;
    cityId: number; // Изменен тип с string на number
    date: string;
    fajr: string; // Изменено с fajrStart на fajr
    shuruk: string; // Добавлено поле shuruk
    zuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
}

interface Mosque {
    id: number;
    cityId: number;
    name: string;
    logoUrl: string | null;
}

interface City {
    id: number;
    name: string;
    logoUrl: string | null;
}



const PrayerTime: React.FC<PrayerTimeProps> = ({time, label, highlight, pic, pic2, remainingTime, progress}) => {
    return (
        <div
            className={`w-full h-full  rounded-3xl  flex flex-col justify-between sm-max:gap-4 ${
                highlight ? 'bg-[#5ec262] transform 2xl:scale-[120%]  p-2 ' : 'bg-white p-6 2xl-max:p-5 sm-max:p-4'
            }`}
        >
            {/* Верхняя часть: Иконка и блок времени */}
            <div className="flex items-start justify-between "> 
                {/* Иконка */}
                <div className={`w-[90px] h-[90px]  flex  3xl-max:w-[70px] 3xl-max:h-[70px] bg-transparent ${highlight&&'m-4 2xl-max:m-3 sm-max:m-2'}`}>
                    <Image
                        className="min-w-full min-h-full object-contain "
                        src={highlight ? pic2 : pic}
                        alt={label}
                    />
                </div>

                {/* Оставшееся время */}
                {highlight && (
                        <div className="2xl:flex-grow 2xl-max:pl-6  max-w-[160px] bg-white rounded-tr-3xl rounded-lg rounded-bl-[40px] p-3 flex flex-col items-end">
                            <div className="text-[#a0a2b1] text-[10px] pc:text-sm font-normal">осталось</div>
                            <div className="text-[#17181d] text-[12px] pc:text-base font-bold">
                                {formatTime(remainingTime)}
                            </div>
                    </div>
                )}
                      
            </div>

            <div className={`flex flex-col items-start gap-0.5 ${highlight&&'px-4 pb-4 2xl-max:px-3 2xl-max:pb-3 sm-max:px-2 sm-max:pb-2'} ${
                        highlight ? 'text-white' : 'text-dark-100'
                    }`}>
                {/* Время */}
                <div
                    className={`text-center text-[60px]  leading-none font-bold 3xl-max:text-[40px]`}
                >
                    {time}
                </div>

                {/* Название молитвы */}
                <div
                    className={`text-center text-[40px]  3xl-max:text-3xl`}
                >
                    {label}
                </div>
                {highlight&&(

                  <div className="w-full h-2 mt-8 3xl-max:mt-5 bg-gray-200 rounded-full ">
                            <div
                                className="h-full bg-white rounded-full min-w-1"
                                style={{width: `${progress}%`}}
                            ></div>
                        </div>
                )}
            </div>
        </div>
    );
};



// Функция для расчета разницы времени в миллисекундах
const calculateTimeDifference = (targetTime: string): number => {
    const currentTime = new Date();
    // Обнуляем секунды и миллисекунды у текущего времени для точного расчета
    currentTime.setSeconds(0, 0);
    
    const [hours, minutes] = targetTime.split(':').map(Number);
    const targetDateTime = new Date(currentTime);
    targetDateTime.setHours(hours, minutes, 0, 0);

    const difference = targetDateTime.getTime() - currentTime.getTime();
    return Math.max(difference, 0);
};

// Форматирование времени в часы и минуты
const formatTime = (milliseconds: number): string => {
    // Округляем до целых минут
    const totalMinutes = Math.round(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
        return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
};

const calculateProgress = (remainingTime: number, totalDuration: number): number => {
    return Math.min((1 - remainingTime / totalDuration) * 100, 100);
};

export function Test() {

    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [nearestPrayer, setNearestPrayer] = useState<string | null>(null);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [totalDuration, setTotalDuration] = useState<number>(0);
    const [cities, setCities] = useState<City[]>([]);
    const [mosques, setMosques] = useState<Mosque[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('Казань');
    const [selectedMosque, setSelectedMosque] = useState<string | null>(null);
    const [hijriDate, setHijriDate] = useState(null);
    const [cityDropdownOpen, setCityDropdownOpen] = useState<boolean>(false);
    const [mosqueDropdownOpen, setMosqueDropdownOpen] = useState<boolean>(false);
    const [mosqueName, setMosqueName] = useState<string | null>(null);
    const [currentCityId, setCurrentCityId] = useState<number | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentName, setCurrentName] = useState(namesOfAllah[currentIndex]);
    const [qrCode, setQrCode] = useState('');
    const [currentMosqueId, setCurrentMosqueId] = useState<number | null>(null);
    const [state, setState] = useState({
        prayerTimes: null,
        nearestPrayer: null,
        remainingTime: 0,
        totalDuration: 0,
        cities: [],
        mosques: [],
        selectedCity: 'Казань',
        selectedMosque: null,
        hijriDate: null,
        currentCityId: null,
        currentMosqueId: null,
    });

    const prayers = [
        {
            time: prayerTimes?.fajr || '00:00',
            label: 'Фаджр',
            highlight: nearestPrayer === 'fajr',
            pic: fadjr,
            pic2: fadjr2
        },
        {
            time: prayerTimes?.shuruk || '00:00',
            label: 'Шурук',
            highlight: nearestPrayer === 'shuruk',
            pic: shuruk,
            pic2: shuruk2
        },
        {
            time: prayerTimes?.zuhr || '00:00',
            label: 'Зухр',
            highlight: nearestPrayer === 'zuhr',
            pic: zuhr,
            pic2: zuhr2
        },
        {time: prayerTimes?.asr || '00:00', label: 'Аср', highlight: nearestPrayer === 'asr', pic: asr, pic2: asr2},
        {
            time: prayerTimes?.maghrib || '00:00',
            label: 'Магриб',
            highlight: nearestPrayer === 'maghrib',
            pic: magrib,
            pic2: magrib2
        },
        {time: prayerTimes?.isha || '00:00', label: 'Иша', highlight: nearestPrayer === 'isha', pic: isha, pic2: isha2},
    ];

    const hijriMonths = [
        'Мухаррам', 'Сафар', 'Раби аль-авваль', 'Раби ас-сани',
        'Джумад аль-уля', 'Джумад ас-сания', 'Раджаб', 'Шаабан',
        'Рамадан', 'Шавваль', 'Зу-ль-када', 'Зу-ль-хиджа'
    ];


    const getHijriDate = () => {
        const hijriDate = moment().format('iD-iM-iYYYY'); // Форматирование даты по Хиджре
        const [day, monthIndex, year] = hijriDate.split('-');
        const monthName = hijriMonths[parseInt(monthIndex) - 1]; // Получаем название месяца на русском

        return `${day} ${monthName} ${year}`;
    };
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const mosqueRef = useRef<HTMLDivElement | null>(null);

    // Запрос данных о городах
    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await axios.get<City[]>(`${API_BASE_URL}/api/cities`);
                setCities(response.data);
                // Устанавливаем cityId для выбранного города
                const selectedCityData = response.data.find(city => city.name === selectedCity);
                setCurrentCityId(selectedCityData?.id || null); // Устанавливаем cityId
            } catch (error) {
                console.error('Ошибка при загрузке списка городов:', error);
            }
        };
        getHijriDate()
        fetchCities();
    }, [selectedCity]); // Добавлено selectedCity как зависимость

    useEffect(() => {
        const fetchMosques = async () => {
            try {
                const response = await axios.get<Mosque[]>(`${API_BASE_URL}/api/mosques`);
                setMosques(response.data);

                // Устанавливаем первую мечеть для выбранного города по умолчанию
                const mosquesInCity = response.data.filter(mosque => mosque.cityId === currentCityId);
                if (mosquesInCity.length > 0) {
                    setSelectedMosque(mosquesInCity[0].name)
                    setCurrentMosqueId(mosquesInCity[0].id)
                } else {
                    setSelectedMosque(null); // Если мечетей нет, сбрасываем выбор
                }
            } catch (error) {
                console.error('Ошибка при загрузке мечетей:', error);
            }
        };

        fetchMosques();
    }, [currentCityId]); // Теперь запрос зависит от идентификатора выбранного города

    useEffect(() => {
        const fetchPrayerTimes = async () => {
            try {
                const response = await axios.get<PrayerResponse>(
                    `${API_BASE_URL}/api/prayers/today?cityName=${selectedCity}`
                );
                const {fajr, shuruk, zuhr, asr, maghrib, isha} = response.data;

                setPrayerTimes({
                    fajr,
                    shuruk,
                    zuhr,
                    asr,
                    maghrib,
                    isha,
                });
                setMosqueName(mosqueName);
                setHijriDate(hijriDate);
            } catch (error) {
                console.error('Ошибка при загрузке данных:', error);
            }
        };

        fetchPrayerTimes();
    }, [selectedCity, selectedMosque]); // Добавлено 'selectedMosque' как зависимость

    useEffect(() => {
        if (!prayerTimes) return;

        const prayerTimesArray = Object.entries(prayerTimes);
        let closestPrayer = '';
        let minDifference = Infinity;

        prayerTimesArray.forEach(([prayerName, time]) => {
            const difference = calculateTimeDifference(time);
            if (difference < minDifference && difference > 0) {
                minDifference = difference;
                closestPrayer = prayerName;
            }
        });

        setNearestPrayer(closestPrayer);
        setRemainingTime(minDifference);
        setTotalDuration(minDifference);

        const timer = setInterval(() => {
            setRemainingTime((prevTime) => {
                if (prevTime <= 1000) {
                    let nextPrayerIndex = prayerTimesArray.findIndex(([name]) => name === closestPrayer) + 1;
                    if (nextPrayerIndex >= prayerTimesArray.length) {
                        nextPrayerIndex = 0; // Переход на первый намаз, если все намазы прошли
                    }
                    const nextPrayerName = prayerTimesArray[nextPrayerIndex][0];
                    const nextPrayerTime = prayerTimesArray[nextPrayerIndex][1];
                    setNearestPrayer(nextPrayerName);
                    return calculateTimeDifference(nextPrayerTime);
                }
                return prevTime - 1000;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [prayerTimes, nearestPrayer])

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % namesOfAllah.length);
            setCurrentName(namesOfAllah[(currentIndex + 1) % namesOfAllah.length]);
        }, 30000);

        return () => clearInterval(interval);
    }, [currentIndex]);

    useEffect(() => {
        if (currentMosqueId) {
            const fetchQRCode = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/qrcodes/by-mosque/${currentMosqueId}`);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    const data = await response.json();
                    if (data.imageUrl) {
                        setQrCode(data.imageUrl); // Устанавливаем QR-код
                    } else {
                        setQrCode(''); // Если QR-код не найден
                    }
                } catch (error) {
                    setQrCode(''); // Ошибка, сбрасываем QR-код
                    console.error('Ошибка при получении QR-кода:', error);
                }
            };

            fetchQRCode(); // Запрос на получение QR-кода для выбранной мечети
        }
    }, [currentMosqueId]); // Зависимость от ID мечети

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target as Node)
          ) {
            setCityDropdownOpen(false);
          }
          if (
            mosqueRef.current &&
            !mosqueRef.current.contains(event.target as Node)
          ) {
            setMosqueDropdownOpen(false);
          }
        };
        
    
        const handleScroll = () => {
          setCityDropdownOpen(false);
          setMosqueDropdownOpen(false);
        };
    
        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll);
    
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
          window.removeEventListener("scroll", handleScroll);
        };
      }, []);
    const handleMosqueSelect = (mosque: Mosque) => {
        setSelectedMosque(mosque.name);
        setCurrentMosqueId(mosque.id); // Устанавливаем идентификатор текущей мечети
        setMosqueDropdownOpen(false); // Закрываем выпадающий список
    };

    const getLogoUrl = () => {
        const mosque = mosques.find(m => m.name === selectedMosque && m.cityId === currentCityId);
        const city = cities.find(c => c.id === currentCityId);

        if (mosque?.logoUrl) {
            return `${API_BASE_URL}/${mosque.logoUrl}`;
        } else if (city?.logoUrl) {
            return `${API_BASE_URL}${city.logoUrl}`;
        } else {
            return 'https://placeholder.apptor.studio/61/61/product1.png'; // URL заглушки, если логотипа нет
        }
    };

    return (
        <div className="w-full h-screen  bg-gray-150 p-6 overflow-x-hidden sm-max:p-4   2xl-max:p-5 ">
            <div
                className="w-full border-5 border-gray-50 bg-gray-150  rounded-5xl flex items-center justify-between p-6  sm-max:p-4 sm-max:rounded-3xl   2xl-max:p-5 xl-max:flex-col xl-max:gap-4 sm-max:gap-3">

                <div className="flex gap-8 items-center 2xl-max:gap-4">
                    <div className="text-text-dark-100 min-w-max text-tv-time h-21.5 items-center  2xl-max:text-4xl sm-max:text-2xl   sm-max:rounded-xl font-bold py-3 px-12 2xl-max:px-5 rounded-3xl bg-gray-50 flex gap-0 ">
                        {new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
                        <span className='text-3xl font-medium  flex w-12 min-w-12 sm-max:text-base'>:
  {String(new Date().getSeconds()).padStart(2, '0')}
</span>
                    </div>
                    <p className='text-4xl font-medium 2xl-max:text-1.5xl sm-max:text-base'>
                    {(() => {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    const weekday = now.toLocaleDateString('ru-RU', { weekday: 'long' });
    return `${date} ${weekday}`;
  })()}
                    </p>
                   
                </div>

                <div className="flex flex-wrap items-center  lg-max:justify-center lg:flex-row sm-max:flex-row gap-4 ">
                    <div className="flex flex-col bg-white rounded-2xl items-center font-medium  px-6 h-21.5 sm-max:h-12 sm-max:rounded-xl justify-center  sm-max:px-3 ">
                        <div className="text-gray-850 text-base  sm-max:text-xs">Дата по хиджре</div>
                        <div className="text-dark-100 text-1.5xl  sm-max:text-sm">{getHijriDate()}</div>
                    </div>
                    <div className="flex flex-col bg-white cursor-pointer relative rounded-2xl items-center font-medium sm-max:h-12 sm-max:rounded-xl  px-6 h-21.5 justify-center  sm-max:px-3 "  onClick={() => setCityDropdownOpen(prev => !prev)} ref={dropdownRef}>
                        <div className="text-gray-850 text-base  sm-max:text-xs">Город</div>
                        <div className="text-dark-100 text-1.5xl  sm-max:text-sm"> {selectedCity}  
                             {cityDropdownOpen && (
                                        <div
                                            className="absolute bg-white text-gray-850 border rounded-lg shadow-lg min-w-max max-h-48 overflow-y-auto z-1000 text-xl sm-max:text-sm sm-max:max-w-32 sm-max:min-w-32 sm-max:w-32">
                                            {cities.map((city) => (
                                                <div key={city.id} className="p-2 hover:bg-gray-200 cursor-pointer sm-max:truncate"
                                                     onClick={() => {
                                                         setSelectedCity(city.name);
                                                     }}>
                                                    {city.name}
                                                </div>
                                            ))}
                                         </div>
                                    )}
                            
                        </div>
                    </div>
                    <div className="flex flex-col bg-white rounded-2xl items-center font-medium  px-6 h-21.5 sm-max:h-12 sm-max:rounded-xl justify-center  sm-max:px-3 cursor-pointer "  onClick={() => setMosqueDropdownOpen(prev => !prev)} ref={mosqueRef}>
                        <div className="text-gray-850 text-base sm-max:text-xs">Мечеть</div>
                        <div className="text-dark-100 text-1.5xl  sm-max:text-sm">
                        {selectedMosque}
                        {mosqueDropdownOpen && (
                                        <div
                                            className="absolute bg-white border rounded-lg shadow-lg min-w-max max-h-48 overflow-y-auto z-1000 text-gray-850">
                                            {mosques.filter(mosque => mosque.cityId === currentCityId).map((mosque) => (
                                                <div key={mosque.id} className="p-2 hover:bg-gray-200 cursor-pointer sm-max:text-sm"
                                                     onClick={() => handleMosqueSelect(mosque)}>
                                                    {mosque.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                        </div>
                    </div>
                    <img className="w-21.5 h-21.5 object-cover rounded-3xl sm-max:h-12 sm-max:rounded-xl sm-max:w-12" src={getLogoUrl()} alt="avatar"/>
                </div>
            </div>
            <div className="grid grid-cols-6 sm-max:rounded-3xl    2xl-max:grid-cols-3 2xl-max:h-auto gap-5 rounded-5xl justify-between h-[400px]  w-full mt-10 border-5  sm-max:p-4 border-gray-50 bg-gray-150 p-6  sm-max:grid-cols-1 2xl-max:p-5 sm-max:mt-5">
                {prayers.map((prayer, index) => (
                    <div       key={index} className={
                        prayer.highlight
                          ? index === 5
                            ? 'ml-5 2xl-max:mx-0'
                            : 'mx-5 2xl-max:mx-0'
                          : ''
                      }>
                        <PrayerTime
                  
                            time={prayer.time}
                            label={prayer.label}
                            highlight={prayer.highlight}
                            pic={prayer.pic}
                            pic2={prayer.pic2}
                            remainingTime={remainingTime}
                            progress={calculateProgress(remainingTime, totalDuration)}
                        />
                    </div>
                ))}
            </div>
            <div className="w-full text-dark-100    flex justify-between items-center relative mt-18 h-[300px]   gap-6 lg-max:flex-col lg-max:h-auto lg-max:mt-10 sm-max:mt-5 sm-max:gap-4">
            <div className="text-[80px]  font-bold rounded-3xl border-5 border-white leading-[100%] p-6 h-full lg-max:w-full lg-max:justify-center  flex items-center sm-max:text-[60px]">
                            {currentName.arabic}
                        </div>
                        <div className="flex lg-max:w-full lg-max:justify-center lg-max:p-5 flex-col flex-grow  h-full justify-center  rounded-3xl bg-gray-250 items-center gap-1 text-[60px] leading-[100%] font-bold 2xl-max:text-4xl sm-max:text-2xl">
                        <div className="text-center">
                            {currentName.pronunciation}
                        </div>
                        <div className="text-center">
                            {currentName.explanation}
                        </div>
                    </div>
               
                <div className="  flex flex-col  h-full justify-between lg-max:w-full lg-max:max-w-full   bg-[#5EC262] rounded-3xl py-6 px-4 max-w-[270px] sm-max:items-center lg-max:gap-8">
                    <div className='text-white text-3xl flex justify-between items-center font-bold'>
                    Помощь
                    мечети
                    <Image
                        className="w-[76px] h-[76px] object-contain "
                        src={phone}
                        alt="phone"
                    />
                    </div>
                        {qrCode && (
                            <img 
                                className="w-[190px] lg:w-[160px] xl:w-[190px] h-[190px] lg:h-[160px] xl:h-[190px] rounded-[20px]" 
                                src={`${API_BASE_URL}${qrCode}`}
                                // src="https://placeholder.apptor.studio/190/190/product1.png"
                                alt="QR Code"
                            />
                        )}
                </div>
            </div>
        </div>
    );
}
