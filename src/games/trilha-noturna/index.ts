import {lazy} from 'react';
import type {GameDefinition} from '@shared/ui/arcade';
import {NightThumbnail} from '@shared/ui/atmosphere/SceneThumbnails';
export const trilhaNoturna:GameDefinition={id:'trilha-noturna',title:'Trilha Noturna',tagline:'Uma lanterna, seis luzes e algo na névoa. Atravesse a floresta ou explore sem perseguição.',featured:true,themeColor:{light:'#0b1721',dark:'#0b1721'},Thumbnail:NightThumbnail,Screen:lazy(()=>import('./ui/NightGame')),highlights:()=>['Suspense atmosférico','Exploração tranquila']};
