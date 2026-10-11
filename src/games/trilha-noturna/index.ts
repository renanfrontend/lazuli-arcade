import {lazy} from 'react';
import type {GameDefinition} from '@shared/ui/arcade';
import {NightThumbnail} from '@shared/ui/atmosphere/SceneThumbnails';
export const trilhaNoturna:GameDefinition={id:'trilha-noturna',title:'Último Espetáculo',tagline:'Uma mansão, brinquedos assombrados e um palhaço que não quer deixar você sair. Encontre as peças. Despiste. Fuja.',featured:true,themeColor:{light:'#170d10',dark:'#170d10'},Thumbnail:NightThumbnail,Screen:lazy(()=>import('./ui/NightGame')),highlights:()=>['Terror em primeira pessoa','Perseguição e esconderijos']};
