'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ClientData {
  businessId: string;
  businessName: string;
  ownerEmail: string;
  ownerName: string;
  totalCost: number;
  openaiCost: number;
  telnyxCost: number;
  storesCount: number;
}

interface AllClientsData {
  allClients: ClientData[];
  totalClients: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export default function AllClientsConsumption() {
  const [data, setData] = useState<AllClientsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'totalCost' | 'businessName' | 'storesCount'>('totalCost');

  const fetchAllClients = async (page: number = currentPage, size: number = pageSize) => {
    try {
      setLoading(true);
      const url = `/api/admin/consumption?limit=0&page=${page}&pageSize=${size}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Erreur chargement données');
      }
      
      const result = await response.json();
      console.log('API Response:', result); // Debug log
      
      // The API modified returns the clients in the regular structure
      // but when limit=0, we need to get all clients from the detailedSummaries
      // and aggregate them by business
      const clientsMap = new Map<string, ClientData>();
      
      // Process detailed summaries to aggregate by business
      if (result.detailedSummaries) {
        result.detailedSummaries.forEach((summary: any) => {
          const key = summary.businessId;
          if (clientsMap.has(key)) {
            const existing = clientsMap.get(key)!;
            existing.totalCost += summary.totalCost;
            existing.openaiCost += summary.openai.totalCost;
            existing.telnyxCost += summary.telnyx.totalCost;
            existing.storesCount += 1;
          } else {
            clientsMap.set(key, {
              businessId: summary.businessId,
              businessName: summary.businessName,
              ownerEmail: summary.ownerEmail,
              ownerName: summary.ownerEmail.split('@')[0], // Fallback name
              totalCost: summary.totalCost,
              openaiCost: summary.openai.totalCost,
              telnyxCost: summary.telnyx.totalCost,
              storesCount: 1
            });
          }
        });
      }
      
      const allClientsArray = Array.from(clientsMap.values())
        .sort((a, b) => b.totalCost - a.totalCost);
      
      // Apply pagination
      const startIndex = (page - 1) * size;
      const endIndex = startIndex + size;
      const paginatedClients = allClientsArray.slice(startIndex, endIndex);
      const totalPages = Math.ceil(allClientsArray.length / size);
      
      setData({
        allClients: paginatedClients,
        totalClients: allClientsArray.length,
        currentPage: page,
        totalPages,
        pageSize: size
      });
      
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      console.error('Error fetching all clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllClients();
  }, [currentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (data?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize);
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
  };

  const filteredClients = data?.allClients.filter(client => 
    client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sortedClients = [...filteredClients].sort((a, b) => {
    switch (sortBy) {
      case 'businessName':
        return a.businessName.localeCompare(b.businessName);
      case 'storesCount':
        return b.storesCount - a.storesCount;
      case 'totalCost':
      default:
        return b.totalCost - a.totalCost;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement de tous les clients...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center text-red-600">
            <Users className="h-4 w-4 mr-2" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Tous les Clients - Consommation ({data?.totalClients || 0})
          </CardTitle>
          <Button onClick={() => fetchAllClients()} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filtres et contrôles */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalCost">Coût Total</SelectItem>
                <SelectItem value="businessName">Nom A-Z</SelectItem>
                <SelectItem value="storesCount">Nb Boutiques</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tableau des clients */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Propriétaire</TableHead>
                <TableHead className="text-right">Boutiques</TableHead>
                <TableHead className="text-right">OpenAI</TableHead>
                <TableHead className="text-right">Telnyx</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedClients.length > 0 ? (
                sortedClients.map((client) => (
                  <TableRow key={client.businessId}>
                    <TableCell className="font-medium">
                      {client.businessName}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        <div className="text-sm">{client.ownerName || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{client.ownerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{client.storesCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(client.openaiCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(client.telnyxCost)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(client.totalCost)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {searchTerm ? 'Aucun client trouvé avec ces critères' : 'Aucun client trouvé'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, data.totalClients)} sur {data.totalClients} clients
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm">
                Page {currentPage} sur {data.totalPages}
              </span>
              
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= data.totalPages}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}