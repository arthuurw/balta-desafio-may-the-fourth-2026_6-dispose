using Dispose.Api.Data.Entities;

namespace Dispose.Api.Data;

public static class SeedData
{
    public static void Seed(DisposeContext context)
    {
        if (context.CollectionSchedules.Any()) return;

        var centro = "Centro";
        var belaVista = "Bela Vista";
        var liberdade = "Liberdade";
        var pinheiros = "Pinheiros";
        var lapa = "Lapa";

        var organico = "organico";
        var reciclavel = "reciclavel";
        var vidro = "vidro";
        var poda = "poda";

        var seteAoMeioDia = "07:00–12:00";
        var oitoAsQuatorze = "08:00–14:00";
        var seteAsTreze = "07:00–13:00";

        var schedules = new List<CollectionSchedule>
        {
            // Centro
            new() { Neighborhood = centro, WasteType = organico, DaysJson = """["segunda","quarta","sexta"]""", TimeSlot = seteAoMeioDia },
            new() { Neighborhood = centro, WasteType = reciclavel, DaysJson = """["terca","sabado"]""", TimeSlot = oitoAsQuatorze, Notes = "Separar papel, plástico e metal em sacolas transparentes" },
            new() { Neighborhood = centro, WasteType = vidro, DaysJson = """["segunda"]""", TimeSlot = oitoAsQuatorze, Notes = "Usar sacolas azuis" },
            new() { Neighborhood = centro, WasteType = poda, DaysJson = """["quinta"]""", TimeSlot = seteAsTreze, Notes = "Agendar pelo 156. Máximo 1m³ por coleta" },

            // Bela Vista
            new() { Neighborhood = belaVista, WasteType = organico, DaysJson = """["terca","quinta","sabado"]""", TimeSlot = seteAoMeioDia },
            new() { Neighborhood = belaVista, WasteType = reciclavel, DaysJson = """["segunda","sexta"]""", TimeSlot = oitoAsQuatorze },
            new() { Neighborhood = belaVista, WasteType = vidro, DaysJson = """["quarta"]""", TimeSlot = oitoAsQuatorze },
            new() { Neighborhood = belaVista, WasteType = poda, DaysJson = """["sexta"]""", TimeSlot = seteAsTreze },

            // Liberdade
            new() { Neighborhood = liberdade, WasteType = organico, DaysJson = """["segunda","quarta","sexta"]""", TimeSlot = seteAoMeioDia },
            new() { Neighborhood = liberdade, WasteType = reciclavel, DaysJson = """["terca","sexta"]""", TimeSlot = oitoAsQuatorze },
            new() { Neighborhood = liberdade, WasteType = vidro, DaysJson = """["terca"]""", TimeSlot = oitoAsQuatorze },
            new() { Neighborhood = liberdade, WasteType = poda, DaysJson = """["quarta"]""", TimeSlot = seteAsTreze },

            // Pinheiros
            new() { Neighborhood = pinheiros, WasteType = organico, DaysJson = """["segunda","quarta","sexta"]""", TimeSlot = "06:00–11:00" },
            new() { Neighborhood = pinheiros, WasteType = reciclavel, DaysJson = """["terca","quinta"]""", TimeSlot = "07:00–13:00" },
            new() { Neighborhood = pinheiros, WasteType = vidro, DaysJson = """["quarta"]""", TimeSlot = seteAsTreze },
            new() { Neighborhood = pinheiros, WasteType = poda, DaysJson = """["segunda"]""", TimeSlot = seteAsTreze, Notes = "Máximo 1m³" },

            // Lapa
            new() { Neighborhood = lapa, WasteType = organico,   DaysJson = """["terca","quinta","sabado"]""", TimeSlot = seteAoMeioDia },
            new() { Neighborhood = lapa, WasteType = reciclavel, DaysJson = """["segunda","quinta"]""", TimeSlot = oitoAsQuatorze },
            new() { Neighborhood = lapa, WasteType = vidro,      DaysJson = """["sexta"]""", TimeSlot = oitoAsQuatorze },
            new() { Neighborhood = lapa, WasteType = poda,       DaysJson = """["terca"]""",TimeSlot = seteAsTreze },
        };

        var points = new List<CollectionPoint>
        {
            new()
            {
                Name = "Ecoponto Anhangabaú",
                Address = "Rua Boa Vista, 50 — Centro",
                Latitude = -23.5465, Longitude = -46.6353,
                AcceptedTypesJson = """["pilhas","eletronicos","oleo"]""",
                OpeningHours = "Seg–Sex 08:00–18:00"
            },
            new()
            {
                Name = "Ecoponto Bela Vista",
                Address = "Av. Paulista, 900 — Bela Vista",
                Latitude = -23.5630, Longitude = -46.6543,
                AcceptedTypesJson = """["pilhas","eletronicos","medicamentos"]""",
                OpeningHours = "Seg–Sáb 08:00–17:00"
            },
            new()
            {
                Name = "Farmácia Liberdade",
                Address = "Rua Galvão Bueno, 120 — Liberdade",
                Latitude = -23.5582, Longitude = -46.6348,
                AcceptedTypesJson = """["medicamentos"]""",
                OpeningHours = "Seg–Sáb 08:00–20:00"
            },
            new()
            {
                Name = "TecnoRecicla Augusta",
                Address = "Rua Augusta, 800 — Consolação",
                Latitude = -23.5565, Longitude = -46.6540,
                AcceptedTypesJson = """["eletronicos"]""",
                OpeningHours = "Seg–Sex 09:00–18:00"
            },
            new()
            {
                Name = "Ecoponto Pinheiros",
                Address = "Rua dos Pinheiros, 400 — Pinheiros",
                Latitude = -23.5640, Longitude = -46.6822,
                AcceptedTypesJson = """["pilhas","eletronicos","oleo","medicamentos"]""",
                OpeningHours = "Seg–Sex 08:00–17:00"
            },
            new()
            {
                Name = "Posto Lapa (Óleo)",
                Address = "Av. Antártica, 650 — Lapa",
                Latitude = -23.5182, Longitude = -46.7025,
                AcceptedTypesJson = """["oleo"]""",
                OpeningHours = "Diário 06:00–22:00"
            },
            new()
            {
                Name = "Farmácia Centro",
                Address = "Rua 25 de Março, 200 — Centro",
                Latitude = -23.5423, Longitude = -46.6290,
                AcceptedTypesJson = """["medicamentos","pilhas"]""",
                OpeningHours = "Seg–Sáb 07:00–20:00"
            },
            new()
            {
                Name = "Ecoponto Consolação",
                Address = "Rua da Consolação, 1200 — Consolação",
                Latitude = -23.5522, Longitude = -46.6548,
                AcceptedTypesJson = """["pilhas","eletronicos","vidro"]""",
                OpeningHours = "Seg–Sex 08:00–18:00"
            },
        };

        context.CollectionSchedules.AddRange(schedules);
        context.CollectionPoints.AddRange(points);
        context.SaveChanges();
    }
}