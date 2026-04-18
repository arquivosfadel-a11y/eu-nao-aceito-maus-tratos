import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, StyleSheet,
} from 'react-native';

const SECONDARY = '#52B788';
const TEXT      = '#1A1A2E';

let ibgeCache = null;
let loadingPromise = null;

function loadIbge() {
  if (ibgeCache) return Promise.resolve();
  if (loadingPromise) return loadingPromise;
  loadingPromise = fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
    .then(r => r.json())
    .then(data => {
      ibgeCache = data.map(m => `${m.nome} — ${m.microrregiao.mesorregiao.UF.sigla}`);
    });
  return loadingPromise;
}

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function CityAutocomplete({ value, onChange, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [ibgeLoading, setIbgeLoading] = useState(!ibgeCache);

  useEffect(() => {
    if (ibgeCache) return;
    setIbgeLoading(true);
    loadIbge().then(() => setIbgeLoading(false));
  }, []);

  useEffect(() => {
    if (!ibgeCache || query.length < 2) { setSuggestions([]); return; }
    const q = normalize(query);
    const matches = ibgeCache.filter(c => normalize(c).includes(q)).slice(0, 8);
    setSuggestions(matches);
  }, [query]);

  const select = (label) => {
    setQuery(label);
    onChange(label);
    setSuggestions([]);
  };

  return (
    <View>
      <View style={[styles.inputWrapper, suggestions.length > 0 && styles.inputWrapperOpen]}>
        <Text style={styles.icon}>📍</Text>
        <TextInput
          style={styles.input}
          placeholder={ibgeLoading ? 'Carregando cidades...' : (placeholder || 'Digite sua cidade...')}
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={v => { setQuery(v); onChange(v); }}
          editable={!ibgeLoading}
          autoCorrect={false}
        />
        {ibgeLoading && <ActivityIndicator size="small" color={SECONDARY} style={{ marginLeft: 8 }} />}
      </View>

      {suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, i) => `${item}-${i}`}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={suggestions.length > 4}
            style={{ maxHeight: 200 }}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.item, index < suggestions.length - 1 && styles.itemBorder]}
                onPress={() => select(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.itemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 12,
    borderWidth: 1.5, borderColor: SECONDARY,
    paddingHorizontal: 14, height: 52,
  },
  inputWrapperOpen: {
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
  },
  icon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: TEXT },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1.5, borderTopWidth: 0, borderColor: SECONDARY,
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 4,
  },
  item: { paddingHorizontal: 16, paddingVertical: 12 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F7F4' },
  itemText: { fontSize: 14, color: TEXT },
});
