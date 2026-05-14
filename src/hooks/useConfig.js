import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '../lib/queryKeys';
import { api } from '../api';

const DEFAULT_CONFIG = {
  restaurantName: 'masterGrowth Gourmet',
  rut: '76.123.456-7',
  direccion: 'Av. Providencia 1234, Santiago',
  currency: '$', currencyCode: 'CLP',
  openTime: '11:00', closeTime: '23:30',
  taxRate: 19,
  paymentMethods: { cash:true, card:true, transfer:true, qr:false },
  timezone: 'America/Santiago',
  idioma: 'es',
  formatoFecha: 'DD/MM/YYYY',
  prefijoTicket: 'TKT',
  numeroInicial: 1,
  impuestoActivo: true,
  logoUrl: '',
};

export const useConfig = ({ user }) => {
  const queryClient = useQueryClient();
  const [config, setConfig]         = useState(DEFAULT_CONFIG);
  const [configSaved, setConfigSaved]   = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configTab, setConfigTab]       = useState('negocio');
  const [logoFile, setLogoFile]         = useState(null);
  const [logoPreview, setLogoPreview]   = useState(null);

  const configQ = useQuery({
    queryKey: qk.config(),
    queryFn:  () => api.getConfig(),
    enabled:  !!user,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!configQ.data) return;
    const data = configQ.data;
    setConfig({
      restaurantName: data.nombre        ?? 'masterGrowth Gourmet',
      rut:            data.rut           ?? '',
      direccion:      data.direccion     ?? '',
      currency:       data.currency      ?? '$',
      currencyCode:   data.currency_code ?? 'CLP',
      openTime:       data.open_time     ?? '11:00',
      closeTime:      data.close_time    ?? '23:30',
      taxRate:        data.tax_rate      ?? 19,
      paymentMethods: data.payment_methods ?? { cash:true, card:true, transfer:true, qr:false },
      timezone:       data.timezone      ?? 'America/Santiago',
      idioma:         data.idioma        ?? 'es',
      formatoFecha:   data.formato_fecha ?? 'DD/MM/YYYY',
      prefijoTicket:  data.prefijo_ticket  ?? 'TKT',
      numeroInicial:  data.numero_inicial  ?? 1,
      impuestoActivo: data.impuesto_activo != null ? Boolean(data.impuesto_activo) : true,
      logoUrl:        data.logo_url        ?? '',
    });
  }, [configQ.data]);

  const saveConfig = async () => {
    setConfigSaving(true);
    try {
      let finalLogoUrl = config.logoUrl;
      if (logoFile) {
        const { logoUrl } = await api.uploadLogo(logoFile);
        finalLogoUrl = logoUrl;
        setLogoFile(null);
        if (logoPreview) { URL.revokeObjectURL(logoPreview); setLogoPreview(null); }
      }
      await api.saveConfig({
        nombre:          config.restaurantName,
        rut:             config.rut,
        direccion:       config.direccion,
        currency:        config.currency,
        currency_code:   config.currencyCode,
        open_time:       config.openTime,
        close_time:      config.closeTime,
        tax_rate:        config.taxRate,
        payment_methods: config.paymentMethods,
        timezone:        config.timezone,
        idioma:          config.idioma,
        formato_fecha:   config.formatoFecha,
        prefijo_ticket:  config.prefijoTicket,
        numero_inicial:  config.numeroInicial,
        impuesto_activo: config.impuestoActivo,
        logo_url:        finalLogoUrl,
      });
      setConfig(prev => ({ ...prev, logoUrl: finalLogoUrl }));
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2500);
    } catch(e) {
      alert('Error al guardar: ' + e.message);
    } finally {
      setConfigSaving(false);
    }
  };

  const loadConfig = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.config() });
  }, [queryClient]);

  return {
    config, setConfig,
    configSaved, configSaving,
    configTab, setConfigTab,
    logoFile, setLogoFile,
    logoPreview, setLogoPreview,
    saveConfig, loadConfig,
  };
};
