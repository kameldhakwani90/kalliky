import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";

const invoices = [
    { id: "INV-2024-005", date: "01/05/2024", amount: "99,00€", status: "Payée" },
    { id: "INV-2024-004", date: "01/04/2024", amount: "99,00€", status: "Payée" },
    { id: "INV-2024-003", date: "01/03/2024", amount: "49,00€", status: "Payée" },
];

export default function BillingPage() {
    return (
        <div className="space-y-6">
             <header>
                <h1 className="text-3xl font-bold tracking-tight">Facturation et Abonnement</h1>
                <p className="text-muted-foreground">Gérez votre plan et consultez votre historique de facturation.</p>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Votre Abonnement Actuel</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-baseline">
                           <p className="text-lg font-semibold">Plan Pro</p>
                           <p><span className="text-3xl font-bold">99€</span>/mois</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Votre abonnement sera renouvellé le 1er juin 2024.</p>
                        <Button variant="outline" className="w-full">Changer de plan</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Moyen de Paiement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-muted rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 38 24" fill="none"><path d="M34.95 4.5h-32A2.95 2.95 0 0 0 0 7.45v13.1A2.95 2.95 0 0 0 2.95 23.5h32A2.95 2.95 0 0 0 37.95 20.55V7.45A2.95 2.95 0 0 0 34.95 4.5Zm-28.5 13.1a1.47 1.47 0 1 1 0-2.95 1.47 1.47 0 0 1 0 2.95Zm10.41 0a1.47 1.47 0 1 1 0-2.95 1.47 1.47 0 0 1 0 2.95Z" fill="#242328"/><path d="M2.95.5h32A2.95 2.95 0 0 1 37.95 3.45v1.05h-38V3.45A2.95 2.95 0 0 1 2.95.5Z" fill="#242328"/></svg>
                            <div>
                                <p className="font-semibold">Visa se terminant par 4242</p>
                                <p className="text-sm text-muted-foreground">Expire le 12/26</p>
                            </div>
                        </div>
                         <Button variant="outline" className="w-full">Mettre à jour</Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historique des Factures</CardTitle>
                    <CardDescription>Retrouvez toutes vos factures pour votre abonnement Kalliky.ai.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Facture N°</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Télécharger</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.id}</TableCell>
                                    <TableCell>{invoice.date}</TableCell>
                                    <TableCell>{invoice.amount}</TableCell>
                                    <TableCell>
                                        <Badge className={invoice.status === "Payée" ? "bg-green-100 text-green-800" : ""}>
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
