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
        return <Badge variant="outline" className="font-mono text-[10px] sm:text-xs">PENDING</Badge>;
      case 'processing':
        return <Badge className="bg-accent/20 text-accent font-mono text-[10px] sm:text-xs"><Loader2 className="w-3 h-3 mr-1 animate-spin" />PROCESSING</Badge>;
      case 'closed':
        return <Badge className="bg-primary/20 text-primary font-mono text-[10px] sm:text-xs"><CheckCircle className="w-3 h-3 mr-1" />CLOSED</Badge>;
      case 'error':
        return <Badge variant="destructive" className="font-mono text-[10px] sm:text-xs"><AlertCircle className="w-3 h-3 mr-1" />ERROR</Badge>;
      case 'protected':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="font-mono text-[10px] sm:text-xs cursor-help"><Shield className="w-3 h-3 mr-1" />SKIPPED</Badge>
            </TooltipTrigger>
            <TooltipContent><p className="font-mono text-xs">Too New (&lt;24h old)</p></TooltipContent>
          </Tooltip>
        );
    }
  };

  if (accounts.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8 sm:py-12 px-4 rounded-xl bg-card border border-border">
        <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto mb-3 sm:mb-4" />
        <h3 className="text-lg sm:text-xl font-semibold mb-2 font-mono">NO DUST FOUND</h3>
        <p className="text-sm text-muted-foreground font-mono">Your wallet is clean! No empty token accounts detected.</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <h3 className="font-semibold font-mono text-sm sm:text-lg text-primary whitespace-nowrap">// KILL LIST</h3>
          <Badge variant="outline" className="font-mono text-[10px] sm:text-xs">{accounts.length}</Badge>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onSelectAll} disabled={allSelected} className="font-mono text-[10px] sm:text-xs px-2 sm:px-3 h-7 sm:h-8">ALL</Button>
          <Button variant="ghost" size="sm" onClick={onDeselectAll} disabled={selectedCount === 0} className="font-mono text-[10px] sm:text-xs px-2 sm:px-3 h-7 sm:h-8">NONE</Button>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="block sm:hidden">
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-border">
            {accounts.map((account, index) => (
              <motion.div
                key={account.address + account.mint}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * index }}
                className={`p-3 flex items-start gap-3 ${account.status === 'closed' ? 'opacity-50' : ''} ${account.status === 'protected' ? 'opacity-60' : ''}`}
              >
                <Checkbox
                  checked={account.selected}
                  disabled={account.status !== 'pending'}
                  onCheckedChange={() => onToggleSelection(account.address)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <code className="font-mono text-xs">{truncateAddress(account.address)}</code>
                      <button onClick={() => copyAddress(account.address)} className="text-muted-foreground hover:text-foreground">
                        {copiedAddress === account.address ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    {getStatusBadge(account)}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                    <Badge variant={account.type === 'wSOL' ? 'default' : 'secondary'} className="font-mono text-[10px] h-4 px-1.5">{account.type}</Badge>
                    <span className={account.status === 'protected' ? 'text-accent' : ''}>
                      {getAccountAge(account.createdAt)}
                    </span>
                    <span className="ml-auto text-foreground font-medium">{account.balance.toFixed(6)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block">
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
      </div>
    </motion.div>
  );
};
