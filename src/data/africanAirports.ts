export interface Airport {
  icao: string;
  iata?: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  elevation: number; // feet
  hasCustoms: boolean;
  hasFuel: boolean;
  fuelTypes?: string[];
  runwaySurface?: 'paved' | 'gravel' | 'grass' | 'dirt';
  notes?: string;
}

export const africanAirports: Airport[] = [
  // SOUTH AFRICA
  { icao: 'FAOR', iata: 'JNB', name: 'O.R. Tambo International', city: 'Johannesburg', country: 'South Africa', lat: -26.1392, lng: 28.246, elevation: 5558, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1', 'Avgas 100LL'], runwaySurface: 'paved' },
  { icao: 'FACT', iata: 'CPT', name: 'Cape Town International', city: 'Cape Town', country: 'South Africa', lat: -33.9648, lng: 18.6017, elevation: 151, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1', 'Avgas 100LL'], runwaySurface: 'paved' },
  { icao: 'FALE', iata: 'DUR', name: 'King Shaka International', city: 'Durban', country: 'South Africa', lat: -29.6144, lng: 31.1197, elevation: 295, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1', 'Avgas 100LL'], runwaySurface: 'paved' },
  { icao: 'FAGM', iata: 'GCJ', name: 'Grand Central', city: 'Johannesburg', country: 'South Africa', lat: -25.9863, lng: 28.1401, elevation: 5325, hasCustoms: false, hasFuel: true, fuelTypes: ['Avgas 100LL', 'Jet A-1'], runwaySurface: 'paved' },
  { icao: 'FALA', iata: 'HLA', name: 'Lanseria International', city: 'Johannesburg', country: 'South Africa', lat: -25.9385, lng: 27.9261, elevation: 4517, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1', 'Avgas 100LL'], runwaySurface: 'paved' },
  { icao: 'FAKN', iata: 'MQP', name: 'Kruger Mpumalanga International', city: 'Nelspruit', country: 'South Africa', lat: -25.3832, lng: 31.1056, elevation: 2829, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'FAPN', iata: 'PHW', name: 'Phalaborwa Airport', city: 'Phalaborwa', country: 'South Africa', lat: -23.9372, lng: 31.1554, elevation: 1432, hasCustoms: false, hasFuel: true, fuelTypes: ['Avgas 100LL'], runwaySurface: 'paved' },
  { icao: 'FAHS', iata: 'HDS', name: 'Hoedspruit Air Force Base', city: 'Hoedspruit', country: 'South Africa', lat: -24.3686, lng: 31.0487, elevation: 1743, hasCustoms: false, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'FAWB', iata: 'PRY', name: 'Wonderboom Airport', city: 'Pretoria', country: 'South Africa', lat: -25.6539, lng: 28.2242, elevation: 4095, hasCustoms: false, hasFuel: true, fuelTypes: ['Avgas 100LL', 'Jet A-1'], runwaySurface: 'paved' },
  { icao: 'FAUP', iata: 'UTN', name: 'Upington Airport', city: 'Upington', country: 'South Africa', lat: -28.3961, lng: 21.2602, elevation: 2782, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  
  // BOTSWANA
  { icao: 'FBSK', iata: 'GBE', name: 'Sir Seretse Khama International', city: 'Gaborone', country: 'Botswana', lat: -24.5553, lng: 25.9182, elevation: 3299, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1', 'Avgas 100LL'], runwaySurface: 'paved' },
  { icao: 'FBMN', iata: 'MUB', name: 'Maun Airport', city: 'Maun', country: 'Botswana', lat: -19.9726, lng: 23.4311, elevation: 3093, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1', 'Avgas 100LL'], runwaySurface: 'paved', notes: 'Okavango Delta gateway' },
  { icao: 'FBKE', iata: 'BBK', name: 'Kasane Airport', city: 'Kasane', country: 'Botswana', lat: -17.8329, lng: 25.1624, elevation: 3289, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved', notes: 'Chobe National Park gateway' },
  { icao: 'FBFT', iata: 'FRW', name: 'Francistown Airport', city: 'Francistown', country: 'Botswana', lat: -21.1596, lng: 27.4745, elevation: 3283, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'FBNB', iata: 'NBE', name: 'Nata Airport', city: 'Nata', country: 'Botswana', lat: -20.2073, lng: 26.2318, elevation: 2921, hasCustoms: false, hasFuel: false, runwaySurface: 'gravel' },

  // NAMIBIA
  { icao: 'FYWH', iata: 'WDH', name: 'Hosea Kutako International', city: 'Windhoek', country: 'Namibia', lat: -22.4799, lng: 17.4709, elevation: 5640, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1', 'Avgas 100LL'], runwaySurface: 'paved' },
  { icao: 'FYWE', iata: 'ERS', name: 'Eros Airport', city: 'Windhoek', country: 'Namibia', lat: -22.6122, lng: 17.0804, elevation: 5575, hasCustoms: false, hasFuel: true, fuelTypes: ['Avgas 100LL', 'Jet A-1'], runwaySurface: 'paved' },
  { icao: 'FYWB', iata: 'WVB', name: 'Walvis Bay Airport', city: 'Walvis Bay', country: 'Namibia', lat: -22.9799, lng: 14.6453, elevation: 299, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'FYKT', iata: 'MPA', name: 'Katima Mulilo Airport', city: 'Katima Mulilo', country: 'Namibia', lat: -17.6344, lng: 24.1767, elevation: 3144, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved', notes: 'Caprivi Strip border point' },
  { icao: 'FYRU', iata: 'NDU', name: 'Rundu Airport', city: 'Rundu', country: 'Namibia', lat: -17.9565, lng: 19.7194, elevation: 3627, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'FYOA', iata: 'OND', name: 'Ondangwa Airport', city: 'Ondangwa', country: 'Namibia', lat: -17.8782, lng: 15.9526, elevation: 3599, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },

  // MOZAMBIQUE
  { icao: 'FQMA', iata: 'MPM', name: 'Maputo International', city: 'Maputo', country: 'Mozambique', lat: -25.9208, lng: 32.5726, elevation: 145, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'FQBR', iata: 'BEW', name: 'Beira Airport', city: 'Beira', country: 'Mozambique', lat: -19.7964, lng: 34.9076, elevation: 33, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'FQVL', iata: 'VXC', name: 'Vilankulo Airport', city: 'Vilankulo', country: 'Mozambique', lat: -22.0184, lng: 35.3133, elevation: 46, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved', notes: 'Bazaruto Archipelago access' },
  { icao: 'FQNP', iata: 'APL', name: 'Nampula Airport', city: 'Nampula', country: 'Mozambique', lat: -15.1056, lng: 39.2818, elevation: 1444, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'FQIN', iata: 'INH', name: 'Inhambane Airport', city: 'Inhambane', country: 'Mozambique', lat: -23.8764, lng: 35.4085, elevation: 30, hasCustoms: false, hasFuel: false, runwaySurface: 'paved' },

  // ZIMBABWE
  { icao: 'FVHA', iata: 'HRE', name: 'Robert Gabriel Mugabe International', city: 'Harare', country: 'Zimbabwe', lat: -17.9318, lng: 31.0928, elevation: 4887, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1', 'Avgas 100LL'], runwaySurface: 'paved' },
  { icao: 'FVFA', iata: 'VFA', name: 'Victoria Falls Airport', city: 'Victoria Falls', country: 'Zimbabwe', lat: -18.0959, lng: 25.839, elevation: 3490, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'FVBU', iata: 'BUQ', name: 'Joshua Mqabuko Nkomo International', city: 'Bulawayo', country: 'Zimbabwe', lat: -20.0174, lng: 28.6179, elevation: 4359, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'FVKB', iata: 'KAB', name: 'Kariba Airport', city: 'Kariba', country: 'Zimbabwe', lat: -16.5198, lng: 28.885, elevation: 1706, hasCustoms: true, hasFuel: false, runwaySurface: 'paved', notes: 'Limited services, Lake Kariba' },

  // ZAMBIA
  { icao: 'FLKK', iata: 'LUN', name: 'Kenneth Kaunda International', city: 'Lusaka', country: 'Zambia', lat: -15.3309, lng: 28.4526, elevation: 3779, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1', 'Avgas 100LL'], runwaySurface: 'paved' },
  { icao: 'FLLS', iata: 'LVI', name: 'Harry Mwanga Nkumbula International', city: 'Livingstone', country: 'Zambia', lat: -17.8218, lng: 25.8227, elevation: 3302, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved', notes: 'Victoria Falls access' },
  { icao: 'FLND', iata: 'NLA', name: 'Simon Mwansa Kapwepwe International', city: 'Ndola', country: 'Zambia', lat: -12.9981, lng: 28.6649, elevation: 4167, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'FLLC', iata: 'LXU', name: 'Lukulu Airport', city: 'Lukulu', country: 'Zambia', lat: -14.3746, lng: 23.2469, elevation: 3480, hasCustoms: false, hasFuel: false, runwaySurface: 'grass', notes: 'Bush strip, prior arrangement needed' },

  // TANZANIA
  { icao: 'HTDA', iata: 'DAR', name: 'Julius Nyerere International', city: 'Dar es Salaam', country: 'Tanzania', lat: -6.8781, lng: 39.2026, elevation: 182, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1', 'Avgas 100LL'], runwaySurface: 'paved' },
  { icao: 'HTKJ', iata: 'JRO', name: 'Kilimanjaro International', city: 'Arusha', country: 'Tanzania', lat: -3.4294, lng: 37.0745, elevation: 2932, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'HTZA', iata: 'ZNZ', name: 'Abeid Amani Karume International', city: 'Zanzibar', country: 'Tanzania', lat: -6.2220, lng: 39.2249, elevation: 54, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'HTSE', iata: 'SEU', name: 'Seronera Airstrip', city: 'Serengeti', country: 'Tanzania', lat: -2.4581, lng: 34.8225, elevation: 5080, hasCustoms: false, hasFuel: false, runwaySurface: 'dirt', notes: 'Serengeti NP, dirt strip, wildlife on runway' },
  { icao: 'HTAR', iata: 'ARK', name: 'Arusha Airport', city: 'Arusha', country: 'Tanzania', lat: -3.3678, lng: 36.6333, elevation: 4550, hasCustoms: true, hasFuel: true, fuelTypes: ['Avgas 100LL'], runwaySurface: 'paved' },

  // KENYA
  { icao: 'HKJK', iata: 'NBO', name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya', lat: -1.3192, lng: 36.9278, elevation: 5330, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1', 'Avgas 100LL'], runwaySurface: 'paved' },
  { icao: 'HKWL', iata: 'WIL', name: 'Wilson Airport', city: 'Nairobi', country: 'Kenya', lat: -1.3217, lng: 36.8148, elevation: 5536, hasCustoms: true, hasFuel: true, fuelTypes: ['Avgas 100LL', 'Jet A-1'], runwaySurface: 'paved', notes: 'Primary GA airport for safari flights' },
  { icao: 'HKMO', iata: 'MBA', name: 'Moi International', city: 'Mombasa', country: 'Kenya', lat: -4.0348, lng: 39.5942, elevation: 200, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'HKML', iata: 'MYD', name: 'Malindi Airport', city: 'Malindi', country: 'Kenya', lat: -3.2293, lng: 40.1017, elevation: 80, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'HKMM', iata: 'MRE', name: 'Mara Serena Airstrip', city: 'Masai Mara', country: 'Kenya', lat: -1.4061, lng: 35.008, elevation: 5200, hasCustoms: false, hasFuel: false, runwaySurface: 'dirt', notes: 'Bush strip in Masai Mara NR' },

  // UGANDA
  { icao: 'HUEN', iata: 'EBB', name: 'Entebbe International', city: 'Entebbe', country: 'Uganda', lat: 0.0424, lng: 32.4435, elevation: 3782, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1', 'Avgas 100LL'], runwaySurface: 'paved' },
  
  // ETHIOPIA
  { icao: 'HAAB', iata: 'ADD', name: 'Bole International', city: 'Addis Ababa', country: 'Ethiopia', lat: 8.9779, lng: 38.7993, elevation: 7625, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved', notes: 'High altitude operations' },

  // RWANDA
  { icao: 'HRYR', iata: 'KGL', name: 'Kigali International', city: 'Kigali', country: 'Rwanda', lat: -1.9686, lng: 30.1395, elevation: 4859, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },

  // DRC
  { icao: 'FZAA', iata: 'FIH', name: "N'djili International", city: 'Kinshasa', country: 'DRC', lat: -4.3858, lng: 15.4446, elevation: 1027, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved', notes: 'Fuel quality can be unreliable - filter recommended' },
  { icao: 'FZQA', iata: 'FBM', name: 'Lubumbashi International', city: 'Lubumbashi', country: 'DRC', lat: -11.5913, lng: 27.5309, elevation: 3965, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'FZNA', iata: 'GOM', name: 'Goma International', city: 'Goma', country: 'DRC', lat: -1.6708, lng: 29.2385, elevation: 5089, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved', notes: 'Near active volcano, ash risk' },

  // MALAWI
  { icao: 'FWKI', iata: 'LLW', name: 'Kamuzu International', city: 'Lilongwe', country: 'Malawi', lat: -13.7894, lng: 33.781, elevation: 4035, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },

  // MADAGASCAR
  { icao: 'FMMI', iata: 'TNR', name: 'Ivato International', city: 'Antananarivo', country: 'Madagascar', lat: -18.7969, lng: 47.4789, elevation: 4198, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },

  // ANGOLA
  { icao: 'FNLU', iata: 'LAD', name: 'Quatro de Fevereiro International', city: 'Luanda', country: 'Angola', lat: -8.8584, lng: 13.2312, elevation: 243, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved', notes: 'Complex ATC, Portuguese language preferred' },

  // CONGO
  { icao: 'FCBB', iata: 'BZV', name: 'Maya-Maya Airport', city: 'Brazzaville', country: 'Congo', lat: -4.2517, lng: 15.253, elevation: 1048, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },

  // GABON
  { icao: 'FOOL', iata: 'LBV', name: 'Leon Mba International', city: 'Libreville', country: 'Gabon', lat: 0.4586, lng: 9.4123, elevation: 39, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },

  // CAMEROON
  { icao: 'FKKD', iata: 'DLA', name: 'Douala International', city: 'Douala', country: 'Cameroon', lat: 4.0061, lng: 9.7195, elevation: 33, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },

  // NIGERIA
  { icao: 'DNMM', iata: 'LOS', name: 'Murtala Muhammed International', city: 'Lagos', country: 'Nigeria', lat: 6.5774, lng: 3.3212, elevation: 135, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
  { icao: 'DNAA', iata: 'ABV', name: 'Nnamdi Azikiwe International', city: 'Abuja', country: 'Nigeria', lat: 9.0065, lng: 7.2632, elevation: 1123, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },

  // GHANA
  { icao: 'DGAA', iata: 'ACC', name: 'Kotoka International', city: 'Accra', country: 'Ghana', lat: 5.6052, lng: -0.1668, elevation: 205, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },

  // SENEGAL
  { icao: 'GOBD', iata: 'DSS', name: 'Blaise Diagne International', city: 'Dakar', country: 'Senegal', lat: 14.67, lng: -17.0733, elevation: 290, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },

  // MAURITIUS
  { icao: 'FIMP', iata: 'MRU', name: 'Sir Seewoosagur Ramgoolam International', city: 'Port Louis', country: 'Mauritius', lat: -20.4302, lng: 57.6836, elevation: 186, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },

  // SEYCHELLES
  { icao: 'FSIA', iata: 'SEZ', name: 'Seychelles International', city: 'Mahé', country: 'Seychelles', lat: -4.6734, lng: 55.5218, elevation: 10, hasCustoms: true, hasFuel: true, fuelTypes: ['Jet A-1'], runwaySurface: 'paved' },
];

export const getAirportsByCountry = (country: string) => 
  africanAirports.filter(a => a.country === country);

export const getAirportsWithCustoms = () => 
  africanAirports.filter(a => a.hasCustoms);

export const getAirportsWithFuel = () => 
  africanAirports.filter(a => a.hasFuel);

export const findAirportByICAO = (icao: string) => 
  africanAirports.find(a => a.icao === icao);

export const searchAirports = (query: string) => {
  const q = query.toLowerCase();
  return africanAirports.filter(a => 
    a.icao.toLowerCase().includes(q) || 
    a.name.toLowerCase().includes(q) || 
    a.city.toLowerCase().includes(q) ||
    a.country.toLowerCase().includes(q) ||
    (a.iata && a.iata.toLowerCase().includes(q))
  );
};
