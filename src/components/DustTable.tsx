import { motion } from 'framer-motion';
import { Copy, Check, Shield, AlertCircle, CheckCircle, Loader2, Clock } from 'lucide-react';
import { useState } from 'react';
import { DustAccount } from '@/hooks/useDustScanner';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface DustTableProps {
  accounts: DustAccount[];
  onToggleSelection: (address: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export const DustTable = ({ accounts, onToggleSelection, onSelectAll, onDeselectAll }: DustTableProps) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const pendingAccounts = accounts.filter(a => a.status === 'pending');
  const selectedCount = pendingAccounts.filter(a => a.selected).length;
  const allSelected = selectedCount === pendingAccounts.length && pendingAccounts.length > 0;

  const truncateAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getAccountAge = (createdAt?: number): string => {
    if (!createdAt) return '—';
    const ageMs = Date.now() - createdAt;
    const days = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ageMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return days === 0 ? `${hours}h` : `${days}d`;
  };

  const getStatusBadge = (account: DustAccount) => {
    switch (account.status) {
      case 'pending':
        return <Badge variant="outline" className="font-mono text-xs">PENDING</Badge>;
      case 'processing':
        return <Badge className="bg-accent/20 text-accent font-mono text-xs"><Loader2 className="w-3 h-3 mr-1 animate-spin" />PROCESSING</Badge>;
      case 'closed':
        return <Badge className="bg-primary/20 text-primary font-mono text-xs"><CheckCircle className="w-3 h-3 mr-1" />CLOSED</Badge>;
      case 'error':
        return <Badge variant="destructive" className="font-mono text-xs"><AlertCircle className="w-3 h-3 mr-1" />ERROR</Badge>;
      case 'protected':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="font-mono text-xs cursor-help"><Shield className="w-3 h-3 mr-1" />SKIPPED</Badge>
            </TooltipTrigger>
            <TooltipContent><p className="font-mono text-xs">Too New (&lt;24h old)</p></TooltipContent>
          </Tooltip>
        );
    }
  };

  if (accounts.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 px-4 rounded-xl bg-card border border-border">
        <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2 font-mono">NO DUST FOUND</h3>
        <p className="text-muted-foreground font-mono">Your wallet is clean! No empty token accounts detected.</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold font-mono text-lg text-primary">// KILL LIST</h3>
          <Badge variant="outline" className="font-mono">{accounts.length} ACCOUNTS</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onSelectAll} disabled={allSelected} className="font-mono text-xs">SELECT ALL</Button>
          <Button variant="ghost" size="sm" onClick={onDeselectAll} disabled={selectedCount === 0} className="font-mono text-xs">DESELECT</Button>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="w-12"></TableHead>
              <TableHead className="font-mono text-xs text-primary">ADDRESS</TableHead>
              <TableHead className="font-mono text-xs text-primary">TYPE</TableHead>
              <TableHead className="font-mono text-xs text-primary"><div className="flex items-center gap-1"><Clock className="w-3 h-3" />AGE</div></TableHead>
              <TableHead className="font-mono text-xs text-right text-primary">BALANCE</TableHead>
              <TableHead className="font-mono text-xs text-right text-primary">STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account, index) => (
              <motion.tr
                key={account.address + account.mint}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * index }}
                className={`border-border hover:bg-secondary/30 ${account.status === 'closed' ? 'opacity-50' : ''} ${account.status === 'protected' ? 'opacity-60' : ''}`}
              >
                <TableCell>
                  <Checkbox checked={account.selected} disabled={account.status !== 'pending'} onCheckedChange={() => onToggleSelection(account.address)} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm">{truncateAddress(account.address)}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyAddress(account.address)}>
                      {copiedAddress === account.address ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={account.type === 'wSOL' ? 'default' : 'secondary'} className="font-mono text-xs">{account.type}</Badge>
                </TableCell>
                <TableCell>
                  <span className={`font-mono text-sm ${account.status === 'protected' ? 'text-accent' : 'text-muted-foreground'}`}>
                    {getAccountAge(account.createdAt)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">{account.balance.toFixed(6)}</TableCell>
                <TableCell className="text-right">{getStatusBadge(account)}</TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </motion.div>
  );
};
