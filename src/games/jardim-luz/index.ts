import {lazy} from 'react';
import type {GameDefinition} from '@shared/ui/arcade';
import {GardenThumbnail} from '@shared/ui/atmosphere/SceneThumbnails';
export const jardimLuz:GameDefinition={id:'jardim-luz',title:'Jardim de Luz',tagline:'Desenhe na água, desperte flores e deixe o lago encontrar seu ritmo. Sem relógio, sem perder.',featured:true,themeColor:{light:'#0d1930',dark:'#0d1930'},Thumbnail:GardenThumbnail,Screen:lazy(()=>import('./ui/GardenGame')),highlights:()=>['Relaxante','Luz, água e som']};
